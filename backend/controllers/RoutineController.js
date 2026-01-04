import RoutineModel from "../models/RoutineModel.js";

export const getRoutine = async (req, res) => {
    try {
        const { userId } = req.params;
        const routine = await RoutineModel.find({ userId });
        res.status(200).json(routine);
    } catch (error) {
        res.status(500).json({ message: "Error fetching routine", error: error.message });
    }
};

export const updateRoutineSlot = async (req, res) => {
    try {
        const { userId, day, timeSlot, courseName, roomNo } = req.body;

        const updatedSlot = await RoutineModel.findOneAndUpdate(
            { userId, day, timeSlot },
            { courseName, roomNo },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedSlot);
    } catch (error) {
        res.status(500).json({ message: "Error updating routine slot", error: error.message });
    }
};

export const deleteRoutineSlot = async (req, res) => {
    try {
        const { userId, day, timeSlot } = req.body;
        await RoutineModel.findOneAndDelete({ userId, day, timeSlot });
        res.status(200).json({ message: "Slot cleared" });
    } catch (error) {
        res.status(500).json({ message: "Error clearing routine slot", error: error.message });
    }
};
