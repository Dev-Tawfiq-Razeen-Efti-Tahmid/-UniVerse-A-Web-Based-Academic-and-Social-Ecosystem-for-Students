import express from "express";
import { showForumCreate, CreateChannel} from "../controllers/forumCreateController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", showForumCreate);
router.post("/", CreateChannel);

export default router;
