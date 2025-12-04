import express from "express";
import { showForumDashboard } from "../controllers/forumDashController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", showForumDashboard);
// router.post("/", CreateChannel);

export default router;
