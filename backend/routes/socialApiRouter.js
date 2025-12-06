import express from "express";
import {
  searchUsers,
  getFriendList,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "../controllers/socialApiController.js";

const router = express.Router();

// Search users
router.get("/search", searchUsers);

// Get logged-in user's friend list
router.get("/friends", getFriendList);

// Send friend request
router.post("/request/send/:targetUserId", sendFriendRequest);

// Accept friend request
router.post("/request/accept/:requesterId", acceptFriendRequest);

// Decline friend request
router.post("/request/decline/:requesterId", declineFriendRequest);

export default router;
