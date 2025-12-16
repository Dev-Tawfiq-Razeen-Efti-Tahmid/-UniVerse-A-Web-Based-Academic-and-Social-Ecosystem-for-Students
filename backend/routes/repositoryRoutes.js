import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { renderRepositoryPage } from "../controllers/repositoryController.js";

const router = express.Router();

router.get("/", isAuthenticated, renderRepositoryPage);
export default router;
