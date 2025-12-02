// backend/routes/events.js
import express from "express";
import {
  listUpcomingEvents,
  listUpcomingEventsJson,
} from "../controllers/eventController.js";

const router = express.Router();

// This becomes:  /dashboard/events
router.get("/events", listUpcomingEvents);

// Optional JSON route: /dashboard/events/api
router.get("/events/api", listUpcomingEventsJson);

export default router;
