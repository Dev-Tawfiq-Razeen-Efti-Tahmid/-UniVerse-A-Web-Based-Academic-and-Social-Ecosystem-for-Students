// backend/models/EventModel.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    // When the event starts
    startTime: {
      type: Date,
      required: true,
    },
    // Optional end time
    endTime: {
      type: Date,
      default: null,
    },
    // workshop / club fest / seminar / other
    category: {
      type: String,
      enum: ["workshop", "club fest", "seminar", "other"],
      default: "other",
    },
    // who created the event (optional for now)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // ✅ Model A: events are approved by default
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
