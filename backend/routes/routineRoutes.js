import express from "express";
const router = express.Router();
import { getRoutine, updateRoutineSlot, deleteRoutineSlot } from "../controllers/RoutineController.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View route
router.get("/view", (req, res) => {
    if (!req.session.userData) {
        return res.redirect("/api/login");
    }
    res.render("routine", {
        userId: req.session.userData._id,
        username: req.session.userData.username
    });
});

// API routes
router.get("/:userId", getRoutine);
router.post("/update", updateRoutineSlot);
router.post("/delete", deleteRoutineSlot);

export default router;
