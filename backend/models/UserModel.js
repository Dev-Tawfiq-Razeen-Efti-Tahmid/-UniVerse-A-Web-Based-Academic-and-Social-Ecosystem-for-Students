import mongoose from "mongoose";

// Define the structure (schema) of a User document
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    student_id: {
      type: String,
      required: true,
      unique: true,
    },
    DateOfBirth: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    UserName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    suspensionDuration: {
      type: Number,
      default: null, // Duration in hours (null = permanent suspension)
    },
    suspensionExpiresAt: {
      type: Date,
      default: null, // When suspension expires
    },
  },
  {
    timestamps: true, // ✅ CORRECT PLACE
  }
);

// Create and export the model
export default mongoose.model("User", userSchema);
