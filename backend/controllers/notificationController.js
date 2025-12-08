import NotificationModel from "../models/NotificationModel.js";
import SchedulerModel from "../models/SchedulerModel.js";

// Create notifications for a task (called when task is created)
export const createNotificationsForTask = async (taskId, deadline, userId) => {
  try {
    const task = await SchedulerModel.findById(taskId);
    if (!task) return;

    const reminders = [
      { type: "3days", minutesBefore: 3 * 24 * 60 },
      { type: "1day", minutesBefore: 24 * 60 },
      { type: "1hour", minutesBefore: 60 },
    ];

    for (const reminder of reminders) {
      const scheduledFor = new Date(
        deadline.getTime() - reminder.minutesBefore * 60000
      );
      const now = new Date();

      const notificationSent = scheduledFor <= now; // Mark as sent if time has passed

      await NotificationModel.create({
        userId,
        taskId,
        taskTitle: task.title,
        taskDeadline: deadline,
        reminderType: reminder.type,
        scheduledFor,
        notificationSent,
        sentAt: notificationSent ? now : null,
      });
    }
  } catch (error) {
    console.error("Error creating notifications for task:", error);
  }
};

// Process due notifications (background job - runs every 60 seconds)
export const processDueNotifications = async () => {
  try {
    const now = new Date();

    // Find all notifications that should be sent
    const dueNotifications = await NotificationModel.find({
      notificationSent: false,
      scheduledFor: { $lte: now },
      dismissed: false,
    });

    if (dueNotifications.length > 0) {
      console.log(`📬 Processing ${dueNotifications.length} due notifications`);

      for (const notification of dueNotifications) {
        await NotificationModel.findByIdAndUpdate(notification._id, {
          notificationSent: true,
          sentAt: now,
        });
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
  }
};

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const notifications = await NotificationModel.find({
      userId,
      dismissed: false,
    })
      .sort({ scheduledFor: -1 })
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const count = await NotificationModel.countDocuments({
      userId,
      notificationSent: true,
      read: false,
      dismissed: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "notificationId is required" });
    }

    const updatedNotification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Dismiss notification
export const dismissNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: "notificationId is required" });
    }

    const updatedNotification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      {
        dismissed: true,
        dismissedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      message: "Notification dismissed",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({ error: "Failed to dismiss notification" });
  }
};
