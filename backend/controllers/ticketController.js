import HelpTicket from "../models/HelpTicketModel.js";
import Message from "../models/forumMessage.js";
import channelObj from "../models/channel.js";
import AdminNotification from "../models/AdminNotificationModel.js";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads", "tickets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Create a custom ticket from user
 */
export const createCustomTicket = async (req, res) => {
  try {
    const { title, description, category, priority, reportedUserName } = req.body;
    const userId = req.session.userData._id;
    const username = req.session.userData.username;

    if (!title || !description) {
      return res.json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Handle screenshot uploads
    const screenshotPaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store relative path from public folder
        screenshotPaths.push(`/uploads/tickets/${file.filename}`);
      });
    }

    const ticket = await HelpTicket.create({
      userId,
      username,
      title,
      description,
      category: category || "general",
      priority: priority || "medium",
      ticketType: "custom",
      status: "unchosen",
      reportedUserName: reportedUserName || null,
      screenshotPaths,
    });

    res.json({
      success: true,
      message: "Ticket created successfully",
      ticketId: ticket._id,
      ticket,
    });
  } catch (err) {
    console.error("Create custom ticket error:", err);
    res.json({
      success: false,
      message: "Error creating ticket",
      error: err.message,
    });
  }
};

/**
 * Report a forum message as inappropriate
 */
export const reportMessage = async (req, res) => {
  try {
    const { messageId, channelId, reportedUsername, reason, additionalDetails } = req.body;
    const userId = req.session.userData._id;
    const username = req.session.userData.username;

    if (!messageId || !reason) {
      return res.json({
        success: false,
        message: "Message ID and reason are required",
      });
    }

    // Verify message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return res.json({
        success: false,
        message: "Message not found",
      });
    }

    // Create a report ticket
    const detailsText = additionalDetails ? `\n\nAdditional Details: ${additionalDetails}` : "";
    const ticket = await HelpTicket.create({
      userId,
      username,
      title: `Report: Inappropriate message from ${reportedUsername}`,
      description: `User reported an inappropriate message.\n\nReason: ${reason}\n\nMessage Content: "${message.content}"${detailsText}`,
      category: "inappropriate-content",
      priority: "high",
      ticketType: "report",
      reportedMessageId: messageId,
      reportedChannel: channelId,
      reportedUser: reportedUsername,
      status: "unchosen",
    });

    res.json({
      success: true,
      message: "Message reported successfully. A ticket has been created.",
      ticketId: ticket._id,
    });
  } catch (err) {
    console.error("Report message error:", err);
    res.json({
      success: false,
      message: "Error reporting message",
      error: err.message,
    });
  }
};

/**
 * Get all tickets (admin)
 */
export const getAllTickets = async (req, res) => {
  try {
    const { status, type, search, sortBy } = req.query;
    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.ticketType = type;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    switch (sortBy) {
      case "priority":
        sortOption = { priority: 1, createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
    }

    const tickets = await HelpTicket.find(filter)
      .sort(sortOption)
      .lean();

    res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (err) {
    console.error("Get all tickets error:", err);
    res.json({
      success: false,
      message: "Error fetching tickets",
      error: err.message,
    });
  }
};

/**
 * Get ticket details
 */
export const getTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await HelpTicket.findById(ticketId)
      .populate("userId", "username email")
      .populate("reportedMessageId")
      .lean();

    if (!ticket) {
      return res.json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (err) {
    console.error("Get ticket details error:", err);
    res.json({
      success: false,
      message: "Error fetching ticket details",
      error: err.message,
    });
  }
};

/**
 * Assign ticket to admin
 */
export const assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const adminId = req.session.userData._id;
    const adminUsername = req.session.userData.username;

    const ticket = await HelpTicket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: adminId,
        assignedAdmin: adminUsername,
        status: "processing",
      },
      { new: true }
    );

    if (!ticket) {
      return res.json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket assigned successfully",
      ticket,
    });
  } catch (err) {
    console.error("Assign ticket error:", err);
    res.json({
      success: false,
      message: "Error assigning ticket",
      error: err.message,
    });
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, resolution, adminResponse } = req.body;
    const adminUsername = req.session.userData.username;

    if (!["unchosen", "processing", "completed"].includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const updateData = { status };

    if (status === "completed" && resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    }

    if (status === "completed" && adminResponse) {
      updateData.adminResponse = adminResponse;
    }

    const ticket = await HelpTicket.findByIdAndUpdate(ticketId, updateData, {
      new: true,
    });

    if (!ticket) {
      return res.json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Create notification for user when ticket is completed with a response
    if (status === "completed" && adminResponse) {
      try {
        await AdminNotification.create({
          recipientId: ticket.userId,
          recipientUsername: ticket.username,
          senderId: req.session.userData._id,
          senderUsername: adminUsername,
          title: `Ticket #${ticket._id.toString().slice(-8)} - Response from Admin`,
          message: adminResponse,
          type: "general",
        });
      } catch (notificationErr) {
        console.error("Error creating notification:", notificationErr);
        // Don't fail the ticket update if notification creation fails
      }
    }

    res.json({
      success: true,
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.json({
      success: false,
      message: "Error updating ticket status",
      error: err.message,
    });
  }
};

/**
 * Get user's own tickets
 */
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.session.userData._id;

    const tickets = await HelpTicket.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (err) {
    console.error("Get user tickets error:", err);
    res.json({
      success: false,
      message: "Error fetching tickets",
      error: err.message,
    });
  }
};

/**
 * Show ticket management page (admin)
 */
export const showTicketManagement = async (req, res) => {
  try {
    res.render("adminTicketManagement", {
      username: req.session.userData.username,
    });
  } catch (err) {
    console.error("Ticket management page error:", err);
    res.status(500).send("Failed to load ticket management page");
  }
};

/**
 * Show create ticket page (user)
 */
export const showCreateTicketPage = async (req, res) => {
  try {
    res.render("createTicket", {
      username: req.session.userData.username,
    });
  } catch (err) {
    console.error("Create ticket page error:", err);
    res.status(500).send("Failed to load create ticket page");
  }
};
