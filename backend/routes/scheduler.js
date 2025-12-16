import express from "express";
import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  markAsComplete,
} from "../controllers/schedulerController.js";

const router = express.Router();

// POST /api/scheduler/add - Create a new task
router.post("/add", addTask);

// GET /api/scheduler/:userId - Get all tasks for a user
router.get("/:userId", getTasks);

// PUT /api/scheduler/:taskId - Update a task
router.put("/:taskId", updateTask);

// DELETE /api/scheduler/:taskId - Delete a task
router.delete("/:taskId", deleteTask);

// PATCH /api/scheduler/:taskId/complete - Mark task as complete
router.patch("/:taskId/complete", markAsComplete);

export default router;
