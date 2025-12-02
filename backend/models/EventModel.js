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
    },
    location: {
      type: String,
      required: true,
    },
    // When the event starts
    startTime: {
      type: Date,
      required: true,
    },
    // Optional end time
    endTime: {
      type: Date,
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
      ref: "User", // matches your User model name
      required: false,
    },
    // only approved events should show to students
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
