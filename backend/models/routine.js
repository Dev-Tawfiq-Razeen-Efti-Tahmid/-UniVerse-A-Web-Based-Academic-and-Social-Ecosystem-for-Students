import mongoose from "mongoose";

const routineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: String,
    required: true, // Monday, Tuesday, etc.
  },
  timeSlot: {
    type: String,
    required: true, // e.g., "08:00 - 09:20"
  },
  courseName: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Ensure a user can only have one entry for a specific day and time slot
routineSchema.index({ userId: 1, day: 1, timeSlot: 1 }, { unique: true });

const Routine = mongoose.model("Routine", routineSchema);

export default Routine;
