// import express from "express";
// import {
//   showChatPage,
//   getMessages,
//   getUsersForSidebar,
//   sendMessage,
// } from "../controllers/chatController.js";
// const router = express.Router();
// // Middleware to check if user is logged in
// const isAuthenticated = (req, res, next) => {
//   if (req.session?.userData) {
//     next();
//   } else {
//     res.redirect("/api/login");
//   }
// };
// // IMPORTANT: Order matters! Put specific routes BEFORE parameterized routes
// router.get("/", isAuthenticated, showChatPage);
// router.get("/users", isAuthenticated, getUsersForSidebar); // BEFORE /:id
// router.post("/send/:id", isAuthenticated, sendMessage);
// router.get("/:id", isAuthenticated, getMessages); // AFTER /users
// export default router;

//Gemini

import express from "express";
import {
  renderChatPage,
  getChatHistory,
  saveChatMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// Middleware to ensure user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session?.userData) {
    next();
  } else {
    res.redirect("/api/login");
  }
};

// 1. Render the main chat UI with the sidebar pre-filled
router.get("/", isAuthenticated, renderChatPage);

// 2. API to get history with a specific friend
router.get("/history/:friendId", isAuthenticated, getChatHistory);

// 3. API to save a message to the Database (Socket.io handles the live alert)
router.post("/send", isAuthenticated, saveChatMessage);

export default router;
