import express from "express";
import { requireAdmin } from "../middlewares/auth.js";
import {
  showAdminLanding,
  showAdminDashboard,
  showCreateEventForm,
  createEvent,
  deleteEvent,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/landing", requireAdmin, showAdminLanding);
router.get("/dashboard", requireAdmin, showAdminDashboard);
router.get("/events/create", requireAdmin, showCreateEventForm);
router.post("/events", requireAdmin, createEvent);
router.post("/events/:id/delete", requireAdmin, deleteEvent);

export default router;
