import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const users = await User.find().lean();
  res.json(users);
});

router.post("/", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "name and email required" });
  try {
    const u = await User.create({ name, email });
    res.status(201).json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
