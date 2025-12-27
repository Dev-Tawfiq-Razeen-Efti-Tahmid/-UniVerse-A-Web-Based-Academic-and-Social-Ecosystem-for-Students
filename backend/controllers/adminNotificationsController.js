import AdminNotification from "../models/AdminNotificationModel.js";
import mongoose from "mongoose";

export const getAdminNotifications = async (req, res) => {
  try {
    console.log("[DEBUG] getAdminNotifications called");
    console.log("[DEBUG] Session userData:", req.session?.userData);
    
    if (!req.session?.userData) {
      console.log("[DEBUG] No session userData, redirecting to login");
      return res.redirect("/api/login");
    }

    const userId = req.session.userData._id;
    console.log("[DEBUG] userId from session:", userId, "type:", typeof userId);
    
    // Ensure userId is properly converted to ObjectId
    let userObjectId;
    if (typeof userId === 'string') {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userObjectId = userId;
    }

    console.log("[DEBUG] userObjectId:", userObjectId);

    const notifications = await AdminNotification.find({
      recipientId: userObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("[DEBUG] Found notifications:", notifications.length);

    // Get unread count
    const unreadCount = await AdminNotification.countDocuments({
      recipientId: userObjectId,
      isRead: false,
    });

    console.log("[DEBUG] Unread count:", unreadCount);

    res.render("notifications", {
      notifications,
      unreadCount,
      username: req.session.userData.username,
      error: null,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).render("notifications", {
      notifications: [],
      unreadCount: 0,
      username: req.session?.userData?.username || "User",
      error: err.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ success: false, message: "Notification ID required" });
    }

    const notification = await AdminNotification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read", notification });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ success: false, message: "Error marking notification as read" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    
    // Ensure userId is properly converted to ObjectId
    let userObjectId;
    if (typeof userId === 'string') {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userObjectId = userId;
    }

    await AdminNotification.updateMany(
      { recipientId: userObjectId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({ success: false, message: "Error marking notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ success: false, message: "Notification ID required" });
    }

    await AdminNotification.findByIdAndDelete(notificationId);

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ success: false, message: "Error deleting notification" });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    
    // Ensure userId is properly converted to ObjectId
    let userObjectId;
    if (typeof userId === 'string') {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userObjectId = userId;
    }

    await AdminNotification.deleteMany({ recipientId: userObjectId });

    res.json({ success: true, message: "All notifications deleted" });
  } catch (err) {
    console.error("Delete all notifications error:", err);
    res.status(500).json({ success: false, message: "Error deleting notifications" });
  }
};
