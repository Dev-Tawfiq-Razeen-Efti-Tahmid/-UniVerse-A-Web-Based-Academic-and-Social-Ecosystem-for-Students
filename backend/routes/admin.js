import express from "express";
import { requireAdmin } from "../middlewares/auth.js";
import {
  showAdminLanding,
  showAdminDashboard,
  showCreateEventForm,
  createEvent,
  deleteEvent,
} from "../controllers/adminController.js";
import {
  showChannelManagement,
  searchChannels,
  deleteChannel,
  getChannelStats,
} from "../controllers/adminChannelController.js";
import {
  showTicketManagement,
  getAllTickets,
  getTicketDetails,
  updateTicketStatus,
  assignTicket,
} from "../controllers/ticketController.js";

const router = express.Router();

router.get("/landing", requireAdmin, showAdminLanding);
router.get("/dashboard", requireAdmin, showAdminDashboard);
router.get("/events/create", requireAdmin, showCreateEventForm);
router.post("/events", requireAdmin, createEvent);
router.post("/events/:id/delete", requireAdmin, deleteEvent);

// Channel management routes
router.get("/channels/manage", requireAdmin, showChannelManagement);
router.get("/channels/search", requireAdmin, searchChannels);
router.post("/channels/delete/:channelId", requireAdmin, deleteChannel);
router.get("/channels/stats", requireAdmin, getChannelStats);

// Ticket management routes
router.get("/tickets/manage", requireAdmin, showTicketManagement);
router.get("/tickets/all", requireAdmin, getAllTickets);
router.get("/tickets/:ticketId", requireAdmin, getTicketDetails);
router.put("/tickets/:ticketId/status", requireAdmin, updateTicketStatus);
router.post("/tickets/:ticketId/assign", requireAdmin, assignTicket);

export default router;
