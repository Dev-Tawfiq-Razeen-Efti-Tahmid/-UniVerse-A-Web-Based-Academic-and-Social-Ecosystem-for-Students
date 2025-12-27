import express from "express";
import Routine from "../models/routine.js";

const router = express.Router();

// GET all routine entries for a user
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const routine = await Routine.find({ userId });
        res.status(200).json(routine);
    } catch (error) {
        console.error("Error fetching routine:", error);
        res.status(500).json({ message: "Failed to fetch routine" });
    }
});

// POST save or update a routine entry
router.post("/", async (req, res) => {
    try {
        const { userId, day, timeSlot, courseName } = req.body;

        if (!userId || !day || !timeSlot) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Upsert logic: Update if exists, otherwise create
        const updatedRoutine = await Routine.findOneAndUpdate(
            { userId, day, timeSlot },
            { courseName },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedRoutine);
    } catch (error) {
        console.error("Error saving routine:", error);
        res.status(500).json({ message: "Failed to save routine" });
    }
});

// DELETE a routine entry
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Routine.findByIdAndDelete(id);
        res.status(200).json({ message: "Routine entry deleted" });
    } catch (error) {
        console.error("Error deleting routine entry:", error);
        res.status(500).json({ message: "Failed to delete routine entry" });
    }
});

export default router;
