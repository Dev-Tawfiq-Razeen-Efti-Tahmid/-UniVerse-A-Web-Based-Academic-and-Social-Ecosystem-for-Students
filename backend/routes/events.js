// backend/routes/events.js
import express from "express";

import {
  listUpcomingEvents,
  listUpcomingEventsJson,
  listEventReminders,
  addEventReminder,
  removeEventReminder, 
} from "../controllers/eventController.js";

const router = express.Router();
// show upcoming events
router.get("/events", listUpcomingEvents);

// student reminders page
router.get("/events/reminders", listEventReminders);

// add reminder for an event
router.post("/events/:id/remind", addEventReminder);
router.post("/events/:id/unremind", removeEventReminder);

// json api (already there)
router.get("/api/events", listUpcomingEventsJson);
export default router;