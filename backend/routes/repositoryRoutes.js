import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { renderRepositoryPage, apiSearchResources, downloadResource } from "../controllers/repositoryController.js";
import {
  renderUploadPage,
  uploadMiddleware,
  uploadResource,
} from "../controllers/uploadRepositoryController.js";

const router = express.Router();

router.get("/", isAuthenticated, renderRepositoryPage);

// ✅ JSON API for search results
router.get("/api/resources", isAuthenticated, apiSearchResources);

// ✅ Download route
router.get("/:id/download", isAuthenticated, downloadResource);

router.get("/upload", isAuthenticated, renderUploadPage);
router.post("/upload", isAuthenticated, uploadMiddleware, uploadResource);

export default router;
