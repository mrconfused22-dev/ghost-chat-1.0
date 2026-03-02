const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

function generateAccountCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateFriendCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "GC-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

router.post("/register", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    let accountCode, friendCode, exists;
    do {
      accountCode = generateAccountCode();
      const check = await db.query("SELECT id FROM accounts WHERE account_code = $1", [accountCode]);
      exists = check.rows.length > 0;
    } while (exists);
    do {
      friendCode = generateFriendCode();
      const check = await db.query("SELECT id FROM accounts WHERE friend_code = $1", [friendCode]);
      exists = check.rows.length > 0;
    } while (exists);
    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO accounts (account_code, password_hash, friend_code) VALUES ($1, $2, $3)",
      [accountCode, passwordHash, friendCode]
    );
    const token = jwt.sign({ accountCode }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ accountCode, friendCode, token, isAdmin: false });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { accountCode, password } = req.body;
    if (!accountCode || !password) {
      return res.status(400).json({ error: "Account code and password are required" });
    }
    const result = await db.query("SELECT * FROM accounts WHERE account_code = $1", [accountCode]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid account code or password" });
    }
    const account = result.rows[0];
    if (account.is_banned) {
      return res.status(403).json({ error: "This account has been banned" });
    }
    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid account code or password" });
    }
    const token = jwt.sign({ accountCode }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      accountCode,
      friendCode: account.friend_code,
      displayName: account.display_name,
      isAdmin: account.is_admin === true,
      hasPublicKey: !!account.public_key,
      token
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/set-display-name", verifyToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ error: "Display name must be at least 2 characters" });
    }
    if (displayName.trim().length > 30) {
      return res.status(400).json({ error: "Display name must be under 30 characters" });
    }
    await db.query(
      "UPDATE accounts SET display_name = $1 WHERE account_code = $2",
      [displayName.trim(), req.accountCode]
    );
    res.json({ success: true, displayName: displayName.trim() });
  } catch (err) {
    console.error("Set display name error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/set-public-key", verifyToken, async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ error: "Public key required" });
    await db.query(
      "UPDATE accounts SET public_key = $1 WHERE account_code = $2",
      [publicKey, req.accountCode]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Set public key error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/public-key/:accountCode", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT public_key FROM accounts WHERE account_code = $1",
      [req.params.accountCode]
    );
    if (result.rows.length === 0 || !result.rows[0].public_key) {
      return res.status(404).json({ error: "Public key not found" });
    }
    res.json({ publicKey: result.rows[0].public_key });
  } catch (err) {
    console.error("Get public key error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
