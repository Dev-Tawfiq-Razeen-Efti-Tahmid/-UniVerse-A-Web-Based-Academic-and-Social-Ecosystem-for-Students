import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  renderRepositoryPage,
  apiSearchResources,
  apiRepositoryTree,
  renderMyUploadsPage, 
  downloadResource,
  deleteResource,
} from "../controllers/repositoryController.js";
import {
  renderUploadPage,
  uploadMiddleware,
  uploadResource,
} from "../controllers/uploadRepositoryController.js";

const router = express.Router();

router.get("/", isAuthenticated, renderRepositoryPage);

// ✅ JSON API for search results
router.get("/api/resources", isAuthenticated, apiSearchResources);

// ✅ EXTRA: Tree API for right sidebar (Department → Semester → Course)
router.get("/api/tree", isAuthenticated, apiRepositoryTree);

// ✅ Download route
router.get("/:id/download", isAuthenticated, downloadResource);

router.get("/upload", isAuthenticated, renderUploadPage);
router.post("/upload", isAuthenticated, uploadMiddleware, uploadResource);
router.get("/my-uploads", isAuthenticated, renderMyUploadsPage);
router.post("/:id/delete", isAuthenticated, deleteResource);


export default router;
