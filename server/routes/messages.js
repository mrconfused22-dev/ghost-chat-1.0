const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const redis = require("../redis");
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

// Get chat key for two users (always same regardless of order)
function getChatKey(code1, code2) {
  return [code1, code2].sort().join(":");
}

// GET /api/messages/:friendCode - get messages with a friend
router.get("/:friendAccountCode", verifyToken, async (req, res) => {
  try {
    const { friendAccountCode } = req.params;

    // Verify they are friends
    const areFriends = await db.query(
      "SELECT id FROM friends WHERE account_code = $1 AND friend_account_code = $2",
      [req.accountCode, friendAccountCode]
    );
    if (areFriends.rows.length === 0) {
      return res.status(403).json({ error: "You are not friends with this user" });
    }

    const chatKey = `chat:${getChatKey(req.accountCode, friendAccountCode)}`;
    const messages = await redis.lrange(chatKey, 0, -1);

    const parsed = messages.map(m => typeof m === "string" ? JSON.parse(m) : m);

    // Mark messages as seen by this user
    const updated = parsed.map(m => {
      if (m.to === req.accountCode && !m.seenAt) {
        m.seenAt = new Date().toISOString();
      }
      return m;
    });

    // Save updated seen status back to redis
    if (updated.length > 0) {
      await redis.del(chatKey);
      for (const m of updated) {
        await redis.rpush(chatKey, JSON.stringify(m));
      }
      // Set 7 day expiry as failsafe
      await redis.expire(chatKey, 60 * 60 * 24 * 7);
    }

    res.json(parsed);
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/messages/:friendAccountCode - send a message
router.post("/:friendAccountCode", verifyToken, async (req, res) => {
  try {
    const { friendAccountCode } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ error: "Message too long" });
    }

    // Verify they are friends
    const areFriends = await db.query(
      "SELECT id FROM friends WHERE account_code = $1 AND friend_account_code = $2",
      [req.accountCode, friendAccountCode]
    );
    if (areFriends.rows.length === 0) {
      return res.status(403).json({ error: "You are not friends with this user" });
    }

    // Check not blocked
    const blocked = await db.query(
      "SELECT id FROM blocked WHERE blocker_code = $1 AND blocked_code = $2",
      [friendAccountCode, req.accountCode]
    );
    if (blocked.rows.length > 0) {
      return res.status(403).json({ error: "You cannot message this user" });
    }

    // Get sender display name
    const sender = await db.query(
      "SELECT display_name FROM accounts WHERE account_code = $1",
      [req.accountCode]
    );
    const displayName = sender.rows[0]?.display_name || "Ghost";

    const msg = {
      id: uuidv4(),
      from: req.accountCode,
      to: friendAccountCode,
      displayName,
      message: message.trim(),
      sentAt: new Date().toISOString(),
      seenAt: null
    };

    const chatKey = `chat:${getChatKey(req.accountCode, friendAccountCode)}`;
    await redis.rpush(chatKey, JSON.stringify(msg));
    await redis.expire(chatKey, 60 * 60 * 24 * 7);

    res.json(msg);
  } catch (err) {
    console.error("Send message error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
