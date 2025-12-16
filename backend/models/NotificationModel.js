import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheduler",
      required: true,
    },
    taskTitle: {
      type: String,
      required: true,
    },
    taskDeadline: {
      type: Date,
      required: true,
    },
    reminderType: {
      type: String,
      enum: ["15min", "1hour", "1day", "3days"],
      default: "1day",
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
notificationSchema.index({ userId: 1, notificationSent: 1 });
notificationSchema.index({ userId: 1, dismissed: 1 });
notificationSchema.index({ scheduledFor: 1, notificationSent: 1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);

export default NotificationModel;
