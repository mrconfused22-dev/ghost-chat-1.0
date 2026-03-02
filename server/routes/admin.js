const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

async function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.accountCode = decoded.accountCode;
    const result = await db.query(
      "SELECT is_admin FROM accounts WHERE account_code = $1",
      [req.accountCode]
    );
    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// GET /api/admin/stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [users, reports, banned, worldMessages, groups] = await Promise.all([
      db.query("SELECT COUNT(*) FROM accounts WHERE is_admin = false"),
      db.query("SELECT COUNT(*) FROM reports WHERE resolved = false"),
      db.query("SELECT COUNT(*) FROM accounts WHERE is_banned = true"),
      db.query("SELECT COUNT(*) FROM world_messages WHERE expires_at > NOW()"),
      db.query("SELECT COUNT(*) FROM groups")
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      pendingReports: parseInt(reports.rows[0].count),
      bannedAccounts: parseInt(banned.rows[0].count),
      activeWorldMessages: parseInt(worldMessages.rows[0].count),
      totalGroups: parseInt(groups.rows[0].count)
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/reports
router.get("/reports", verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.reporter_code, r.reported_code, r.reason, r.created_at, r.resolved,
        a.display_name as reported_name, a.is_banned,
        a2.display_name as reporter_name
       FROM reports r
       LEFT JOIN accounts a ON a.account_code = r.reported_code
       LEFT JOIN accounts a2 ON a2.account_code = r.reporter_code
       ORDER BY r.resolved ASC, r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Reports error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/ban
router.post("/ban", verifyAdmin, async (req, res) => {
  try {
    const { accountCode } = req.body;
    if (!accountCode) return res.status(400).json({ error: "Account code required" });

    // Prevent banning other admins
    const target = await db.query(
      "SELECT is_admin FROM accounts WHERE account_code = $1",
      [accountCode]
    );
    if (target.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Cannot ban an admin account" });
    }

    await db.query(
      "UPDATE accounts SET is_banned = true WHERE account_code = $1",
      [accountCode]
    );

    // Mark all reports for this user as resolved
    await db.query(
      "UPDATE reports SET resolved = true WHERE reported_code = $1",
      [accountCode]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Ban error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/unban
router.post("/unban", verifyAdmin, async (req, res) => {
  try {
    const { accountCode } = req.body;
    await db.query(
      "UPDATE accounts SET is_banned = false WHERE account_code = $1",
      [accountCode]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Unban error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/resolve-report
router.post("/resolve-report", verifyAdmin, async (req, res) => {
  try {
    const { reportId } = req.body;
    await db.query(
      "UPDATE reports SET resolved = true WHERE id = $1",
      [reportId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Resolve report error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/users - list all users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT account_code, friend_code, display_name, is_banned, is_admin, created_at
       FROM accounts ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Users error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
