import express from "express";
import { showForumDashboard } from "../controllers/forumDashController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", showForumDashboard);

export default router;
