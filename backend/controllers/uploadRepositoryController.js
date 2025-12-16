import Repository from "../models/RepositoryModel.js";
import multer from "multer";
import path from "path";

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/repository/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File Filter (Allow zip, rar, pdf, docx, pptx)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /rar|zip/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Only archives (zip/rar) and documents are allowed!"));
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter,
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
    // Multer adds 'req.file'
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
