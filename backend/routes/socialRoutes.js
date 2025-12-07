import express from "express";
import {
  showSocialHub,
  searchUsers,
  getFriendList,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getPendingRequests,
  getSentRequests,
  cancelFriendRequest,
} from "../controllers/socialController.js";

const router = express.Router();

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session?.userData) {
    next();
  } else {
    res.redirect("/api/login");
  }
};

// Page route
router.get("/social", isAuthenticated, showSocialHub);

// API routes
router.get("/social/search", isAuthenticated, searchUsers);
router.get("/social/friends", isAuthenticated, getFriendList);
router.get("/social/requests/pending", isAuthenticated, getPendingRequests);
router.get("/social/requests/sent", isAuthenticated, getSentRequests);
router.post("/social/friend-request", isAuthenticated, sendFriendRequest);
router.post("/social/accept-request", isAuthenticated, acceptFriendRequest);
router.post("/social/remove-friend", isAuthenticated, removeFriend);
router.post("/social/cancel-request", isAuthenticated, cancelFriendRequest);

export default router;
