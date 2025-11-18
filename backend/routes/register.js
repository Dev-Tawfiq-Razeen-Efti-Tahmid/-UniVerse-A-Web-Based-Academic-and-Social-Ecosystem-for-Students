import express from "express";
import { showRegisterPage, processRegister} from "../controllers/registrationController.js";
import multer from "multer";
import path from "path";


const storage = multer.diskStorage({
  // Destination where the file will be saved
  destination: (req, file, cb) => {
    // Ensure this directory exists!
    cb(null, '../frontend/FiledataUploads/ProfileInfo'); 
  },
  // Customize the file name to avoid collisions
  filename: (req, file, cb) => {
    // Example: user-1634567890123.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// only route → controller mappings
router.get("/", showRegisterPage);
router.post("/",upload.single('profileImage'), processRegister);

export default router;

// Define where to store the files and how to name them
