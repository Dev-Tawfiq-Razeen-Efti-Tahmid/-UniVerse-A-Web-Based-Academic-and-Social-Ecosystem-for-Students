import express from "express";
import { showdashBoard } from "../controllers/dashboardController.js";
import { showPlanner } from "../controllers/plannerController.js";

const router = express.Router();

router.get("/", showdashBoard);
router.get("/planner", showPlanner);

export default router;
