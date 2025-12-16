import express from "express";
import {
  renderChatPage,
  getChatHistory,
  saveChatMessage,
} from "../controllers/chatController.js";

import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

// 1. Render the main chat UI with the sidebar pre-filled
router.get("/", isAuthenticated, renderChatPage);

// 2. API to get history with a specific friend
router.get("/history/:friendId", isAuthenticated, getChatHistory);

// 3. API to save a message to the Database (Socket.io handles the live alert)
router.post("/send", isAuthenticated, saveChatMessage);

export default router;
