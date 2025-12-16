import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { renderRepositoryPage } from "../controllers/repositoryController.js";
import {
  renderUploadPage,
  uploadMiddleware,
  uploadResource,
} from "../controllers/uploadRepositoryController.js";

const router = express.Router();

router.get("/", isAuthenticated, renderRepositoryPage);
router.get("/upload", isAuthenticated, renderUploadPage);
router.post("/upload", isAuthenticated, uploadMiddleware, uploadResource);

export default router;
