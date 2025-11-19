import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from 'url';
import session from "express-session";
// Load env
dotenv.config();



// 1) Create app FIRST
const app = express();

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);

// 2) Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(session({
  secret: "ThisisASecretKeyForSession",
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));
// --- Middleware ---
app.use(express.json()); // For parsing application/json (used in your processLogin)
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


app.set('view engine', 'ejs');
// 2. Specify the directory where EJS files (your 'views') are located
app.set('views', path.join(DIRNAME, '../frontend')); // Assumes 'frontend' folder is adjacent to server.js









//API ROUTES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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


import loginRouter from "./routes/login.js";
app.use("/api/login", loginRouter);

import registerRouter from "./routes/register.js"; 
app.use("/api/register", registerRouter);

import dashboardRouter from "./routes/dashboard.js";
app.use("/api/dashboard", dashboardRouter);

import logoutRouter from "./routes/logout.js";
app.use("/api/logout", logoutRouter);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



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



