// backend/controllers/eventController.js
import Event from "../models/EventModel.js";
import Reminder from "../models/ReminderModel.js";

export const listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      startTime: { $gte: now },
      isApproved: true,
    })
      .sort({ startTime: 1 })
      .lean();

    // 👇 read ?reminder=1 from the URL
    const reminderAdded = req.query.reminder === "1";

    res.render("events", { events, reminderAdded });
  } catch (err) {
    console.error("Error loading events:", err);
    res.status(500).send("Failed to load events");
  }
};


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
// POST /dashboard/events/:id/remind
export const addEventReminder = async (req, res) => {
  try {
    const user = req.session?.userData;
    if (!user) return res.redirect("/api/login");

    const eventId = req.params.id;

    console.log("Adding reminder for user:", user.userId, "event:", eventId);

    // avoid duplicates
    const existing = await Reminder.findOne({
      user: user.userId,
      event: eventId,
    });

    if (!existing) {
      await Reminder.create({
        user: user.userId,
        event: eventId,
      });
    }

    return res.redirect("/dashboard/events?reminder=1");
  } catch (err) {
    console.error("Error adding reminder:", err);
    return res.status(500).send("Failed to add reminder");
  }
};

// GET /dashboard/events/reminders
export const listEventReminders = async (req, res) => {
  try {
    const user = req.session?.userData;
    if (!user) return res.redirect("/api/login");

    const reminders = await Reminder.find({ user: user.userId })
      .populate("event")
      .lean();

    const events = reminders.map(r => r.event).filter(Boolean);

    const removed = req.query.removed === "1";   // 👈 new flag

    return res.render("eventReminders", { events, removed });
  } catch (err) {
    console.error("Error loading reminders:", err);
    return res.status(500).send("Failed to load reminders");
  }
};

// POST /dashboard/events/:id/unremind
export const removeEventReminder = async (req, res) => {
  try {
    const user = req.session?.userData;
    if (!user) return res.redirect("/api/login");

    const eventId = req.params.id;

    // adjust user.userId / user.id depending on what you stored
    await Reminder.deleteOne({
      user: user.userId,   // or user.id if that's what you used
      event: eventId,
    });

    return res.redirect("/dashboard/events/reminders?removed=1");
  } catch (err) {
    console.error("Error removing reminder:", err);
    return res.status(500).send("Failed to remove reminder");
  }
};
