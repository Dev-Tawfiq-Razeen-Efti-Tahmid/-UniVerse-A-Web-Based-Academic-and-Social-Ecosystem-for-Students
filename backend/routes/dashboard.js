import express from "express";
import { showdashBoard } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", showdashBoard);

export default router;
