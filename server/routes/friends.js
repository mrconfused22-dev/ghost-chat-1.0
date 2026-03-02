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

// POST /api/friends/request - send a friend request using friend code
router.post("/request", verifyToken, async (req, res) => {
  try {
    const { friendCode } = req.body;
    if (!friendCode) return res.status(400).json({ error: "Friend code is required" });

    // Find the account with this friend code
    const target = await db.query(
      "SELECT account_code, display_name FROM accounts WHERE friend_code = $1 AND is_banned = false",
      [friendCode.trim().toUpperCase()]
    );

    if (target.rows.length === 0) {
      return res.status(404).json({ error: "No user found with that friend code" });
    }

    const targetCode = target.rows[0].account_code;
    const targetName = target.rows[0].display_name;

    if (targetCode === req.accountCode) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    // Check if already friends
    const alreadyFriends = await db.query(
      "SELECT id FROM friends WHERE account_code = $1 AND friend_account_code = $2",
      [req.accountCode, targetCode]
    );
    if (alreadyFriends.rows.length > 0) {
      return res.status(400).json({ error: "You are already friends" });
    }

    // Check if blocked
    const blocked = await db.query(
      "SELECT id FROM blocked WHERE blocker_code = $1 AND blocked_code = $2",
      [targetCode, req.accountCode]
    );
    if (blocked.rows.length > 0) {
      return res.status(400).json({ error: "No user found with that friend code" });
    }

    // Check if request already sent
    const existing = await db.query(
      "SELECT id FROM friend_requests WHERE sender_code = $1 AND receiver_code = $2 AND status = 'pending'",
      [req.accountCode, targetCode]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Send request
    await db.query(
      "INSERT INTO friend_requests (sender_code, receiver_code) VALUES ($1, $2)",
      [req.accountCode, targetCode]
    );

    res.json({ success: true, message: `Friend request sent to ${targetName || "user"}` });
  } catch (err) {
    console.error("Friend request error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/requests - get incoming pending requests
router.get("/requests", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT fr.id, fr.sender_code, fr.created_at, a.display_name, a.friend_code
       FROM friend_requests fr
       JOIN accounts a ON a.account_code = fr.sender_code
       WHERE fr.receiver_code = $1 AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.accountCode]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get requests error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/friends/respond - accept or reject a request
router.post("/respond", verifyToken, async (req, res) => {
  try {
    const { requestId, action } = req.body;
    if (!requestId || !action) return res.status(400).json({ error: "Missing fields" });
    if (!["accept", "reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });

    // Get the request
    const request = await db.query(
      "SELECT * FROM friend_requests WHERE id = $1 AND receiver_code = $2 AND status = 'pending'",
      [requestId, req.accountCode]
    );
    if (request.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const senderCode = request.rows[0].sender_code;

    if (action === "accept") {
      // Add both directions to friends table
      await db.query(
        "INSERT INTO friends (account_code, friend_account_code) VALUES ($1, $2), ($3, $4)",
        [req.accountCode, senderCode, senderCode, req.accountCode]
      );
      await db.query(
        "UPDATE friend_requests SET status = 'accepted' WHERE id = $1",
        [requestId]
      );
      res.json({ success: true, message: "Friend request accepted" });
    } else {
      await db.query(
        "UPDATE friend_requests SET status = 'rejected' WHERE id = $1",
        [requestId]
      );
      res.json({ success: true, message: "Friend request rejected" });
    }
  } catch (err) {
    console.error("Respond error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/list - get friends list
router.get("/list", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.friend_account_code, a.display_name, a.friend_code
       FROM friends f
       JOIN accounts a ON a.account_code = f.friend_account_code
       WHERE f.account_code = $1`,
      [req.accountCode]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Friends list error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/friends/block - block a user
router.post("/block", verifyToken, async (req, res) => {
  try {
    const { accountCode } = req.body;
    if (!accountCode) return res.status(400).json({ error: "Account code required" });

    // Remove from friends if exists
    await db.query(
      "DELETE FROM friends WHERE (account_code = $1 AND friend_account_code = $2) OR (account_code = $2 AND friend_account_code = $1)",
      [req.accountCode, accountCode]
    );

    // Add block
    await db.query(
      "INSERT INTO blocked (blocker_code, blocked_code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.accountCode, accountCode]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Block error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/friends/report - report a user
router.post("/report", verifyToken, async (req, res) => {
  try {
    const { accountCode, reason } = req.body;
    if (!accountCode) return res.status(400).json({ error: "Account code required" });

    await db.query(
      "INSERT INTO reports (reporter_code, reported_code, reason) VALUES ($1, $2, $3)",
      [req.accountCode, accountCode, reason || "No reason provided"]
    );

    res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    console.error("Report error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
