import express from "express";
import { showRegisterPage, processRegister} from "../controllers/registrationController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", showRegisterPage);
router.post("/", processRegister);

export default router;
