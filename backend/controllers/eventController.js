// backend/controllers/eventController.js
import Event from "../models/EventModel.js";

// GET /events  → show upcoming, approved events
export const listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      startTime: { $gte: now },   // only future events
      isApproved: true,           // only approved events
    })
      .sort({ startTime: 1 })     // earliest first
      .lean();                    // plain JS objects, nice for EJS

    res.render("events", { events });
  } catch (err) {
    console.error("Error loading events:", err);
    res.status(500).send("Failed to load events");
  }
};

// (optional) JSON API version
export const listUpcomingEventsJson = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      startTime: { $gte: now },
      isApproved: true,
    }).sort({ startTime: 1 });

    res.json(events);
  } catch (err) {
    console.error("Error loading events (JSON):", err);
    res.status(500).json({ error: "Failed to load events" });
  }
};
