import Repository from "../models/RepositoryModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Always upload to backend/public/uploads/repository
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "repository");

// ✅ Ensure folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File Filter (Allow zip, rar)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /rar|zip/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) return cb(null, true);
  cb(new Error("Error: Only archives (zip/rar) are allowed!"));
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
}).single("resourceFile");

// --- CONTROLLER FUNCTIONS ---
export const renderUploadPage = (req, res) => {
  res.render("uploadRepository", {
    user: req.session.userData,
    error: null,
    success: null,
  });
};

export const uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.render("uploadRepository", {
        user: req.session.userData,
        error: "Please select a file to upload.",
        success: null,
      });
    }

    const { title, courseCode, semester, department } = req.body;

    const newResource = new Repository({
      title,
      courseCode,
      semester,
      department,
      fileUrl: `/uploads/repository/${req.file.filename}`,
      originalFileName: req.file.originalname,
      uploadedBy: req.session.userData._id,
    });

    await newResource.save();

    res.render("uploadRepository", {
      user: req.session.userData,
      success: "File uploaded successfully!",
      error: null,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.render("uploadRepository", {
      user: req.session.userData,
      error: "Something went wrong during upload.",
      success: null,
    });
  }
};
