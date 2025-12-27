import express from "express";
import {
  renderChatPage,
  getChatHistory,
  saveChatMessage,
} from "../controllers/chatController.js";

import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.get("/", isAuthenticated, renderChatPage);
router.get("/history/:friendId", isAuthenticated, getChatHistory);

// API to save a message to the Database (Socket.io handles the live alert)
router.post("/send", isAuthenticated, saveChatMessage);

export default router;
