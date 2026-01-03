import express from "express";
import multer from "multer";
import path from "path";
import { requireLogin } from "../middlewares/auth.js";
import {
  showCreateTicketPage,
  createCustomTicket,
  reportMessage,
  getUserTickets,
} from "../controllers/ticketController.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tickets");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = express.Router();

// User ticket routes
router.get("/create", requireLogin, showCreateTicketPage);
router.post("/create", requireLogin, upload.array("screenshots", 3), createCustomTicket);
router.post("/report-message", requireLogin, reportMessage);
router.get("/user/my-tickets", requireLogin, getUserTickets);

export default router;
