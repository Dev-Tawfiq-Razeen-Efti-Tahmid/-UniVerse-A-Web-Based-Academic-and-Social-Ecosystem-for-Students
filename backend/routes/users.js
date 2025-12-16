import express from "express";
import {
  getUsers,
  createUser,
  updateProfile,
  showProfilePage,
} from "../controllers/userController.js";
import { requireLogin } from "../middlewares/auth.js";

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session?.userData) {
    next();
  } else {
    res.redirect("/api/login");
  }
};

// only route → controller mappings
router.get("/", getUsers);
router.post("/", createUser);
// router.put("/update-profile",requireLogin ,updateProfile);
router.get("/profile", isAuthenticated, showProfilePage);
router.post("/update-profile", isAuthenticated, updateProfile);
export default router;
