import mongoose from "mongoose";

const helpTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["technical", "account", "general", "bug", "feature", "inappropriate-content"],
      default: "general",
    },
    ticketType: {
      type: String,
      enum: ["custom", "report"],
      default: "custom",
      required: true,
    },
    // For report tickets - reference to the reported message
    reportedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reportedChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChannelObj",
      default: null,
    },
    reportedUser: {
      type: String, // Username of the user who posted the inappropriate message
      default: null,
    },
    // For user reports - report against another user
    reportedUserName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["unchosen", "processing", "completed"],
      default: "unchosen",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    // Screenshot file paths
    screenshotPaths: {
      type: [String], // Array of file paths to uploaded screenshots
      default: [],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAdmin: {
      type: String, // Admin username
      default: null,
    },
    resolution: {
      type: String,
      default: null,
    },
    adminResponse: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const HelpTicket = mongoose.model("HelpTicket", helpTicketSchema);

export default HelpTicket;
