import mongoose from "mongoose";

const schedulerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    deadline: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["assignment", "study goal", "exam", "project"],
      default: "assignment",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    tags: [String],
    attachments: [
      {
        url: String,
        name: String,
        uploadedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Index for finding user's tasks sorted by deadline
schedulerSchema.index({ userId: 1, deadline: 1 });
schedulerSchema.index({ userId: 1, status: 1 });

const SchedulerModel = mongoose.model("Scheduler", schedulerSchema);

export default SchedulerModel;
