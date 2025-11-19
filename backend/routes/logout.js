import express from "express";
import { logOutUser } from "../controllers/logOutController.js";

const router = express.Router();

router.get("/", logOutUser);

export default router;
