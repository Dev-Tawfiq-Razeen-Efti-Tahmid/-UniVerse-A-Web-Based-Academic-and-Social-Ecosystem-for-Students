import express from "express";
import { requireAdmin } from "../middlewares/auth.js";
import {
  showUserSearch,
  searchUsers,
  suspendUser,
  banUser,
  reactivateUser,
  sendNotificationToUser,
} from "../controllers/userManagementController.js";

const router = express.Router();

router.get("/search", requireAdmin, (req, res, next) => {
  if (req.query.query) {
    searchUsers(req, res);
  } else {
    showUserSearch(req, res);
  }
});

router.post("/suspend", requireAdmin, suspendUser);
router.post("/ban", requireAdmin, banUser);
router.post("/reactivate", requireAdmin, reactivateUser);
router.post("/notify", requireAdmin, sendNotificationToUser);

export default router;
