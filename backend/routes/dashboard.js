import express from "express";
import { showdashBoard } from "../controllers/dashboardController.js";
import { showPlanner } from "../controllers/plannerController.js";
import { showRoutine } from "../controllers/routineController.js";

const router = express.Router();

router.get("/", showdashBoard);
router.get("/planner", showPlanner);
router.get("/routine", showRoutine);

export default router;
