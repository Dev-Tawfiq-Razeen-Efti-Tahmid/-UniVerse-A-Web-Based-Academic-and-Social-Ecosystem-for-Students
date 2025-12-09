import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";

// ---- Routers ----
import usersRouter from "./routes/users.js";
import loginRouter from "./routes/login.js";
import dashboardRouter from "./routes/dashboard.js";
import registerRouter from "./routes/register.js";
import logoutRouter from "./routes/logout.js";
import eventsRouter from "./routes/events.js";
import schedulerRouter from "./routes/scheduler.js";
import notificationsRouter from "./routes/notifications.js";
import { processDueNotifications } from "./controllers/notificationController.js";
import forumRouter from "./routes/forum.js";
import forumApiRouter from "./routes/forumApi.js";
import forumCreateRouter from "./routes/forumCreate.js";
import ForumMessagingRouter from "./routes/ForumMessaging.js";
import Message from "./models/forumMessage.js";
// import socialHubRouter from "./routes/socialHubRouter.js";
// import socialApiRouter from "./routes/socialApiRouter.js";

import socialRoutes from "./routes/socialRoutes.js";

// Load env
dotenv.config();

// 1) Create app FIRST
const app = express();

// Resolve __dirname
const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);

// 2) Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Socket.io setup

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  // Optional: Configure CORS if your frontend is on a different domain/port
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Match frontend URL
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initialize global room users map if it doesn't exist
  if (!io.roomUsers) {
    io.roomUsers = {};
  }

  const roomUsers = io.roomUsers;

  // --- 1. JOIN ROOM ---
  socket.on("joinRoom", (data) => {
    const { channelId, username } = data;

    // Check if user is logged in (optional security step)
    if (!channelId || !username) return;

    // Leave any existing rooms before joining the new one
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        // Remove user from old room's user list
        if (roomUsers[room]) {
          roomUsers[room] = roomUsers[room].filter(
            (u) => u.socketId !== socket.id
          );
        }
        socket.leave(room);
      }
    });

    // Join the specified room
    socket.join(channelId);

    // Initialize room users array if it doesn't exist
    if (!roomUsers[channelId]) {
      roomUsers[channelId] = [];
    }

    // Add user to room
    roomUsers[channelId].push({ username, socketId: socket.id });

    console.log(`${username} joined channel room: ${channelId}`);
    console.log(`Active users in ${channelId}:`, roomUsers[channelId]);

    // Send updated active users list to all clients in the room
    io.to(channelId).emit("activeUsersList", roomUsers[channelId]);

    // Broadcast user count update to ALL clients (for dashboard display)
    io.emit("channelUserCountUpdate", {
      channelId,
      count: roomUsers[channelId].length,
    });

    // Notify others in the room
    socket.to(channelId).emit("userJoined", { username });
  });

  // --- 2. SEND MESSAGE ---
  socket.on("sendMessage", async (data) => {
    const { channelId, userId, username, content } = data;

    console.log("Received sendMessage:", {
      channelId,
      userId,
      username,
      content,
    });

    // Check for empty or invalid message
    if (!content || content.trim() === "") {
      console.warn("Empty message received");
      return;
    }

    if (!channelId || !userId) {
      console.warn("Missing channelId or userId");
      return;
    }

    try {
      // A. Save message to MongoDB
      const newMessage = new Message({
        channel: channelId,
        user: userId,
        username: username,
        content: content,
      });
      await newMessage.save();
      console.log("Message saved to DB:", newMessage._id);

      // B. Emit the message to all clients in the room
      io.to(channelId).emit("message", {
        _id: newMessage._id, // Send the ID for reporting functionality
        username: username,
        content: content,
        timestamp: newMessage.timestamp,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // --- 3. REPORT MESSAGE ---
  socket.on("reportMessage", async (data) => {
    const { messageId, reportingUserId } = data;

    try {
      // Find the message and push the reporting user's ID to the 'reports' array
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { reports: reportingUserId } }, // $addToSet prevents duplicate reports from the same user
        { new: true }
      );

      if (message) {
        console.log(
          `Message ${messageId} reported by user ${reportingUserId}. Total reports: ${message.reports.length}`
        );
        // Optional: Send an admin notification or update the UI to show the message was reported
      }
    } catch (error) {
      console.error("Error reporting message:", error);
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from all rooms
    Object.keys(roomUsers).forEach((roomId) => {
      const roomUserList = roomUsers[roomId];
      const userIndex = roomUserList.findIndex((u) => u.socketId === socket.id);

      if (userIndex !== -1) {
        const removedUser = roomUserList[userIndex];
        roomUserList.splice(userIndex, 1);

        // Notify remaining users in the room
        io.to(roomId).emit("userLeft", removedUser.username);
        io.to(roomId).emit("activeUsersList", roomUserList);

        // Broadcast user count update to ALL clients (for dashboard display)
        io.emit("channelUserCountUpdate", {
          roomId,
          count: roomUserList.length,
        });

        console.log(`${removedUser.username} left room ${roomId}`);
      }
    });
  });

  // --- USER LEFT (Explicit logout) ---
  socket.on("userLeft", (data) => {
    const { username, channelId } = data;

    if (roomUsers[channelId]) {
      roomUsers[channelId] = roomUsers[channelId].filter(
        (u) => u.socketId !== socket.id
      );

      // Notify remaining users
      io.to(channelId).emit("userLeft", username);
      io.to(channelId).emit("activeUsersList", roomUsers[channelId]);

      // Broadcast user count update to ALL clients (for dashboard display)
      io.emit("channelUserCountUpdate", {
        channelId,
        count: roomUsers[channelId].length,
      });

      console.log(`${username} explicitly left room ${channelId}`);
    }
  });
});

// Sessions
app.use(
  session({
    secret: "ThisisASecretKeyForSession",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// View engine (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(DIRNAME, "../frontend"));

// ---------- SIMPLE API / HEALTH ----------
app.get("/", (req, res) => {
  res.send("UniVerse API is running ✅");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "universe-api" });
});

// ---------- ROUTES (IMPORTANT PART) ----------

// API users (JSON)
app.use("/api/users", usersRouter);

// Pages / forms
app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/dashboard", dashboardRouter);
app.use("/api/logout", logoutRouter);
app.use("/dashboard", eventsRouter);
app.use("/api/scheduler", schedulerRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/dashboard/forumDash", forumRouter);
app.use("/dashboard/forumDash/api", forumApiRouter);
app.use("/dashboard/forumDash/ForumCreate", forumCreateRouter);
app.use("/dashboard/forumDash/ForumMessaging/:channelId", ForumMessagingRouter);
app.use("/api/dashboard", socialRoutes);


// ---------- DB + SERVER ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/universe";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    
    // Start background job to process notifications every minute
    setInterval(async () => {
      await processDueNotifications();
    }, 60000); // Run every 60 seconds
    
    console.log("📬 Notification processor started (runs every 60 seconds)");
  })
  .catch((err) => console.error("❌ Mongo error:", err));

httpServer.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
