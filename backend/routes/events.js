// backend/routes/events.js
import express from "express";
import {
  listUpcomingEvents,
  listUpcomingEventsJson,
  // listEventReminders,  // <- make sure this is removed or commented
} from "../controllers/eventController.js";

const router = express.Router();

// /dashboard/events → full list (events.ejs)
router.get("/events", listUpcomingEvents);

// /dashboard/api/events → JSON
router.get("/api/events", listUpcomingEventsJson);

// (optional reminders route for later)
// router.get("/events/reminders", listEventReminders);

export default router;
