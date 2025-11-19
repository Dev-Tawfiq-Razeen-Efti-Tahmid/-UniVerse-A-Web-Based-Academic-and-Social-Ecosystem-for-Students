import User from "../models/UserModel.js";
import path from "path";

export const showdashBoard = async (req, res) => {
  try {
    console.log("Session Data:", req.session.id);
    res.render("dashboard",{username : req.session.userData.username});
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};
