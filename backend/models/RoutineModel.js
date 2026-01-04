import mongoose from "mongoose";

const routineSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        day: {
            type: String,
            required: true,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
        timeSlot: {
            type: String,
            required: true,
        },
        courseName: {
            type: String,
            default: "",
        },
        roomNo: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Compound index to ensure uniqueness of a slot for a user
routineSchema.index({ userId: 1, day: 1, timeSlot: 1 }, { unique: true });

const RoutineModel = mongoose.model("Routine", routineSchema);

export default RoutineModel;
