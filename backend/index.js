import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";

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

// ---------- DB + SERVER ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/universe";

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

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});