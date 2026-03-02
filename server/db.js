const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    console.error("Full error:", err);
  } else {
    console.log("Connected to Supabase database!");
  }
});

module.exports = pool;
