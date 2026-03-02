const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.accountCode = decoded.accountCode;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// GET /api/world/messages - get last 50 messages
router.get("/messages", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, account_code, display_name, message, created_at FROM world_messages WHERE expires_at > NOW() ORDER BY created_at ASC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get world messages error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/world/messages - send a message
router.post("/messages", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ error: "Message too long (max 500 characters)" });
    }

    // Get display name
    const account = await db.query(
      "SELECT display_name, is_banned FROM accounts WHERE account_code = $1",
      [req.accountCode]
    );
    if (account.rows.length === 0) {
      return res.status(401).json({ error: "Account not found" });
    }
    if (account.rows[0].is_banned) {
      return res.status(403).json({ error: "Your account has been banned" });
    }

    const displayName = account.rows[0].display_name || "Ghost";

    const result = await db.query(
      "INSERT INTO world_messages (account_code, display_name, message) VALUES ($1, $2, $3) RETURNING id, account_code, display_name, message, created_at",
      [req.accountCode, displayName, message.trim()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Send world message error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Report a user from world chat
router.post('/report', verifyToken, async (req, res) => {
  try {
    const { reportedCode, reason } = req.body;
    const accountCode = req.accountCode;

    if (!reportedCode) return res.status(400).json({ error: 'No account to report' });
    if (reportedCode === accountCode) return res.status(400).json({ error: 'Cannot report yourself' });

    await db.query(
      'INSERT INTO reports (reporter_code, reported_code, reason) VALUES ($1, $2, $3)',
      [accountCode, reportedCode, reason || 'Reported from World Chat']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Report error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
