import express from "express";
import { showLogin, processLogin } from "../controllers/loginController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", showLogin);
router.post("/", processLogin);

export default router;
