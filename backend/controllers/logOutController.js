import User from "../models/UserModel.js";
import path from "path";

export const logOutUser = async (req, res) => {
  try {
    console.log("Session Data:", req.session.id);
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
      } else {
        console.log("Logged out successfully");
      }
    });
    res.redirect("/api/login");
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};
