import express from "express";
import {
  showSocialHub,
  searchUsers,
  getFriendList,
} from "../controllers/socialApiController.js";

const router = express.Router();

router.get("/", showSocialHub);
router.get("/search", searchUsers);
router.get("/friends", getFriendList);

export default router;
