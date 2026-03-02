const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const db = require("./db");
const authRoutes = require("./routes/auth");
const worldRoutes = require("./routes/world");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "10kb" })); // Limit request body size

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later" }
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: "You are sending messages too fast" }
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/world", messageLimiter, worldRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Ghost Chat server is alive" });
});

// Cleanup job — runs every hour
// Deletes expired world messages and group messages
async function runCleanup() {
  try {
    const worldResult = await db.query(
      "DELETE FROM world_messages WHERE expires_at < NOW() RETURNING id"
    );
    const groupResult = await db.query(
      "DELETE FROM group_messages WHERE expires_at < NOW() RETURNING id"
    );
    const worldCount = worldResult.rowCount || 0;
    const groupCount = groupResult.rowCount || 0;
    if (worldCount > 0 || groupCount > 0) {
      console.log(`Cleanup: deleted ${worldCount} world messages, ${groupCount} group messages`);
    }
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
}

// Run cleanup on startup and then every hour
runCleanup();
setInterval(runCleanup, 60 * 60 * 1000);

// Socket.io
const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("register", (accountCode) => {
    if (typeof accountCode === "string" && accountCode.length < 50) {
      onlineUsers[accountCode] = socket.id;
      socket.accountCode = accountCode;
    }
  });

  socket.on("join_world", () => socket.join("world"));

  socket.on("world_message", (data) => {
    if (data && data.message && typeof data.message === "string") {
      io.to("world").emit("world_message", data);
    }
  });

  socket.on("join_group", (groupId) => {
    if (typeof groupId === "string") socket.join(`group:${groupId}`);
  });

  socket.on("group_message", (data) => {
    if (data && data.groupId) io.to(`group:${data.groupId}`).emit("group_message", data);
  });

  socket.on("private_message", (data) => {
    if (data && data.to) {
      const receiverSocketId = onlineUsers[data.to];
      if (receiverSocketId) io.to(receiverSocketId).emit("private_message", data);
    }
  });

  socket.on("disconnect", () => {
    if (socket.accountCode) delete onlineUsers[socket.accountCode];
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
