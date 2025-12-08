import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  dismissNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// GET /api/notifications/:userId - Get all notifications for a user
router.get("/:userId", getNotifications);

// GET /api/notifications/:userId/unread-count - Get unread notification count
router.get("/:userId/unread-count", getUnreadCount);

// PATCH /api/notifications/:notificationId/read - Mark as read
router.patch("/:notificationId/read", markAsRead);

// DELETE /api/notifications/:notificationId/dismiss - Dismiss notification
router.delete("/:notificationId/dismiss", dismissNotification);

export default router;
