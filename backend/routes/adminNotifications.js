import express from "express";
import { requireLogin } from "../middlewares/auth.js";
import {
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/adminNotificationsController.js";

const router = express.Router();

router.get("/", requireLogin, getAdminNotifications);
router.post("/mark-as-read", requireLogin, markAsRead);
router.post("/mark-all-as-read", requireLogin, markAllAsRead);
router.post("/delete", requireLogin, deleteNotification);
router.post("/delete-all", requireLogin, deleteAllNotifications);

export default router;
