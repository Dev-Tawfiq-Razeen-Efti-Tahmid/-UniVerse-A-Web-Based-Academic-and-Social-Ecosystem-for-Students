import express from "express";
import {
  upvoteChannel,
  downvoteChannel,
  deleteChannel,
  getOwnedChannels,
} from "../controllers/forumDashController.js";

const router = express.Router();

router.post("/:id/upvote", upvoteChannel);
router.post("/:id/downvote", downvoteChannel);
router.delete("/:id", deleteChannel);
router.get("/owned/list", getOwnedChannels);

export default router;
