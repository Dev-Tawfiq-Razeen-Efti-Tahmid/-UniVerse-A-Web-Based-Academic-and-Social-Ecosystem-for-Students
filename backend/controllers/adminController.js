import Event from "../models/EventModel.js";
import User from "../models/UserModel.js";
import HelpTicket from "../models/HelpTicketModel.js";
import channelObj from "../models/channel.js";

export const showAdminLanding = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const channelCount = await channelObj.countDocuments();
    const ticketCount = await HelpTicket.countDocuments();

    res.render("adminLanding", {
      username: req.session.userData.username,
      userCount,
      channelCount,
      ticketCount,
    });
  } catch (err) {
    console.error("Admin landing error:", err);
    res.status(500).send("Failed to load admin landing page");
  }
};

export const showAdminDashboard = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: true }).sort({ startTime: 1 }).lean();

    res.render("adminDashboard", {
      username: req.session.userData.username,
      events,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Failed to load admin dashboard");
  }
};

export const showCreateEventForm = (req, res) => {
  res.render("adminCreateEvent", { error: null });
};

export const createEvent = async (req, res) => {
  try {
    const { title, location, category, description, startTime, endTime } = req.body;

    // datetime-local gives: "2025-12-12T19:32"
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (!title || !location || !startTime || Number.isNaN(start.getTime())) {
      return res.status(400).render("adminCreateEvent", {
        error: "Please provide a valid Title, Location, and Start Time.",
      });
    }

    await Event.create({
      title,
      location,
      category: category || "other", // must match enum
      description: description || "",
      startTime: start,
      endTime: end,
      isApproved: true, // ✅ Model A
      createdBy: req.session.userData._id,
    });

    return res.redirect("/api/admin/dashboard");
  } catch (err) {
    console.error("Create event error:", err);
    return res.status(500).render("adminCreateEvent", {
      error: "Failed to create event. Please try again.",
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    return res.redirect("/api/admin/dashboard");
  } catch (err) {
    console.error("Delete event error:", err);
    return res.status(500).send("Failed to delete event");
  }
};
