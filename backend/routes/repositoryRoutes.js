import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  renderRepositoryPage,
  apiSearchResources,
  apiRepositoryTree,
  renderMyUploadsPage, 
  downloadResource,
  deleteResource,
  renderMyDownloadsPage,      
  removeDownloadHistory
} from "../controllers/repositoryController.js";
import {
  renderUploadPage,
  uploadMiddleware,
  uploadResource,
} from "../controllers/uploadRepositoryController.js";

const router = express.Router();

router.get("/", isAuthenticated, renderRepositoryPage);


router.get("/api/resources", isAuthenticated, apiSearchResources);

router.get("/api/tree", isAuthenticated, apiRepositoryTree);


router.get("/:id/download", isAuthenticated, downloadResource);

router.get("/upload", isAuthenticated, renderUploadPage);
router.post("/upload", isAuthenticated, uploadMiddleware, uploadResource);
router.get("/my-uploads", isAuthenticated, renderMyUploadsPage);
router.post("/:id/delete", isAuthenticated, deleteResource);

router.get("/my-downloads", isAuthenticated, renderMyDownloadsPage);
router.post("/my-downloads/:id/remove", isAuthenticated, removeDownloadHistory);

export default router;
