const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { hmacHash } = require('../hmac');

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.accountCode = decoded.accountCode;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Create a group
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name, memberCodes } = req.body;
    if (!name || name.trim().length < 1) return res.status(400).json({ error: 'Group name required' });

    const { accountCode } = req;
    const hashedCreator = hmacHash(accountCode);

    const result = await db.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name.trim(), hashedCreator]
    );
    const group = result.rows[0];

    // Get creator display name
    const creatorAcc = await db.query('SELECT display_name FROM accounts WHERE account_code = $1', [accountCode]);
    const creatorName = creatorAcc.rows[0]?.display_name || 'Ghost';

    // Add creator as admin
    await db.query(
      'INSERT INTO group_members (group_id, account_code, display_name, is_admin) VALUES ($1, $2, $3, true)',
      [group.id, hashedCreator, creatorName]
    );

    // Add other members
    if (memberCodes && memberCodes.length > 0) {
      for (const code of memberCodes) {
        const acc = await db.query('SELECT display_name FROM accounts WHERE account_code = $1', [code]);
        const displayName = acc.rows[0]?.display_name || 'Ghost';
        await db.query(
          'INSERT INTO group_members (group_id, account_code, display_name, is_admin) VALUES ($1, $2, $3, false)',
          [group.id, hmacHash(code), displayName]
        );
      }
    }

    res.json(group);
  } catch (err) {
    console.error('Create group error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my groups
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const hashed = hmacHash(req.accountCode);
    const result = await db.query(
      `SELECT g.* FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.account_code = $1
       ORDER BY g.created_at DESC`,
      [hashed]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get groups error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group messages
router.get('/:groupId/messages', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const hashed = hmacHash(req.accountCode);

    const member = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND account_code = $2',
      [groupId, hashed]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

    const result = await db.query(
      `SELECT id, display_name, message, created_at FROM group_messages
       WHERE group_id = $1 AND expires_at > NOW()
       ORDER BY created_at ASC`,
      [groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get group messages error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group members (display names only, no raw account codes)
router.get('/:groupId/members', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const hashed = hmacHash(req.accountCode);

    const member = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND account_code = $2',
      [groupId, hashed]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

    const result = await db.query(
      `SELECT id, display_name, is_admin,
       CASE WHEN account_code = $2 THEN true ELSE false END as is_me
       FROM group_members WHERE group_id = $1`,
      [groupId, hashed]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get members error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave group
router.post('/:groupId/leave', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const hashed = hmacHash(req.accountCode);

    await db.query(
      'DELETE FROM group_members WHERE group_id = $1 AND account_code = $2',
      [groupId, hashed]
    );

    const remaining = await db.query(
      'SELECT COUNT(*) FROM group_members WHERE group_id = $1',
      [groupId]
    );
    if (parseInt(remaining.rows[0].count) === 0) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupId]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Leave group error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member (admin only)
router.post('/:groupId/remove', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const hashed = hmacHash(req.accountCode);

    const adminCheck = await db.query(
      'SELECT is_admin FROM group_members WHERE group_id = $1 AND account_code = $2',
      [groupId, hashed]
    );
    if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: 'Not an admin' });

    await db.query('DELETE FROM group_members WHERE id = $1 AND group_id = $2', [memberId, groupId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove member error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send group message (called from socket but also via REST)
router.post('/:groupId/messages', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    const hashed = hmacHash(req.accountCode);

    const member = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND account_code = $2',
      [groupId, hashed]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

    const acc = await db.query('SELECT display_name FROM accounts WHERE account_code = $1', [req.accountCode]);
    const displayName = acc.rows[0]?.display_name || 'Ghost';

    const result = await db.query(
      'INSERT INTO group_messages (group_id, account_code, display_name, message) VALUES ($1, $2, $3, $4) RETURNING id, display_name, message, created_at',
      [groupId, hashed, displayName, message.trim()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Send group message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
