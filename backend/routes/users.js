import express from "express";
import { getUsers, createUser } from "../controllers/userController.js";

const router = express.Router();

// only route → controller mappings
router.get("/", getUsers);
router.post("/", createUser);

export default router;
