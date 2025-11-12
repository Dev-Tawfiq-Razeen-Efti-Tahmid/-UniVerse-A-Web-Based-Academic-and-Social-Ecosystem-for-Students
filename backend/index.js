import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load env
dotenv.config();

// 1) Create app FIRST
const app = express();

// 2) Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('UniVerse API is running ✅');
});

// 3) Health route
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "universe-api" });
});

// 4) Routers (import AFTER app is declared is fine, but imports don't touch `app`)
import usersRouter from "./routes/users.js";
app.use("/api/users", usersRouter);

// 5) DB + server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/universe";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
