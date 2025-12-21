import User from "../models/UserModel.js";
import AdminNotification from "../models/AdminNotificationModel.js";
import mongoose from "mongoose";
import { calculateSuspensionExpiry } from "../utils/suspensionUtils.js";

export const showUserSearch = async (req, res) => {
  try {
    res.render("userManagement", { 
      users: [],
      searchQuery: "",
      successMessage: null,
      errorMessage: null
    });
  } catch (err) {
    console.error("User search page error:", err);
    res.status(500).send("Failed to load user management page");
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.render("userManagement", { 
        users: [],
        searchQuery: "",
        successMessage: null,
        errorMessage: "Please enter a search term"
      });
    }

    // Search by username, email, name, or student_id
    const users = await User.find({
      $or: [
        { UserName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { student_id: { $regex: query, $options: "i" } }
      ]
    }).select("-password").lean();

    res.render("userManagement", { 
      users,
      searchQuery: query,
      successMessage: null,
      errorMessage: users.length === 0 ? "No users found" : null
    });
  } catch (err) {
    console.error("User search error:", err);
    res.render("userManagement", { 
      users: [],
      searchQuery: req.query.query || "",
      successMessage: null,
      errorMessage: "Error searching for users"
    });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId, reason, durationHours } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    // Calculate suspension expiry time
    const suspensionExpiresAt = calculateSuspensionExpiry(durationHours);
    const durationDisplay = durationHours ? `${durationHours} hours` : "permanent";

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "suspended",
        suspendedAt: new Date(),
        suspensionReason: reason || "Account suspended by admin",
        suspensionDuration: durationHours || null,
        suspensionExpiresAt: suspensionExpiresAt,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      message: `User ${user.UserName} has been suspended for ${durationDisplay}`,
      user 
    });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ success: false, message: "Error suspending user" });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "banned",
        bannedAt: new Date(),
        suspensionReason: reason || "Account banned by admin"
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      message: `User ${user.UserName} has been banned`,
      user 
    });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ success: false, message: "Error banning user" });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: "active",
        suspendedAt: null,
        bannedAt: null,
        suspensionReason: null,
        suspensionDuration: null,
        suspensionExpiresAt: null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ 
      success: true, 
      message: `User ${user.UserName} has been reactivated`,
      user 
    });
  } catch (err) {
    console.error("Reactivate user error:", err);
    res.status(500).json({ success: false, message: "Error reactivating user" });
  }
};

export const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate sender is admin
    if (!req.session.userData || req.session.userData.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can send notifications" });
    }

    // Ensure userId is properly converted to ObjectId
    let userObjectId;
    if (typeof userId === 'string') {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      userObjectId = userId;
    }

    // Validate notification type
    const validTypes = ["general", "warning", "suspension", "ban", "account-update"];
    const notificationType = type && validTypes.includes(type) ? type : "general";

    // Save notification to database
    const notification = await AdminNotification.create({
      recipientId: userObjectId,
      recipientUsername: user.UserName,
      senderId: req.session.userData._id,
      senderUsername: req.session.userData.username || "Admin",
      title: title.trim(),
      message: message.trim(),
      type: notificationType,
    });

    res.json({ 
      success: true, 
      message: `Notification sent to ${user.UserName}`,
      notification
    });
  } catch (err) {
    console.error("Send notification error:", err);
    res.status(500).json({ success: false, message: "Error sending notification: " + err.message });
  }
};
