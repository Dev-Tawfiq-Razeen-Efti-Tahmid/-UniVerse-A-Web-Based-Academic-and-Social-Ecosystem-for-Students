import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderUsername: {
      type: String,
      default: "Admin",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["general", "warning", "suspension", "ban", "account-update"],
      default: "general",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
adminNotificationSchema.index({ recipientId: 1, isRead: 1 });
adminNotificationSchema.index({ recipientId: 1, createdAt: -1 });

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);

export default AdminNotification;
