import User from "../models/User.js";
import path from "path";

export const showRegisterPage = async (req, res) => {
  try {
    res.render("registrationPage",{});
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};

export const processRegister = async (req, res) => {
  const { name, id,email,department,Username,pass,dob } = req.body;

  try {
    const user = new User({ name, id, dob,email,Username,pass,department});
    await user.save();
    alert("Registration Successful");
    res.redirect('/api/login');
    res.status(201)
  } catch (err) {
    res.status(400).json({ error: "Error has happened" });
  }
};