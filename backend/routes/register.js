// backend/routes/register.js
import express from "express";
import { showRegisterPage, processRegister } from "../controllers/registrationController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Resolve __dirname for this file (ESM style)
const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);

// ---- Multer storage ----
const storage = multer.diskStorage({
  // Destination where the file will be saved
  destination: (req, file, cb) => {
    // This becomes: backend/routes/../../frontend/FiledataUploads/ProfileInfo
    cb(null, path.join(DIRNAME, "../../frontend/FiledataUploads/ProfileInfo"));
  },

  // Customize the file name to avoid collisions
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "user-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---- Routes → Controllers ----
router.get("/", showRegisterPage);

// Make sure your form uses name="profileImage"
router.post("/", upload.single("profileImage"), processRegister);

export default router;
