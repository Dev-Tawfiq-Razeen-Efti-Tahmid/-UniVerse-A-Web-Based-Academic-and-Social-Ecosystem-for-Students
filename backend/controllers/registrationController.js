import { profile } from "console";
import User from "../models/UserModel.js";
import path from "path";

export const showRegisterPage = async (req, res) => {
  try {
    res.render("registrationPage",{});
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};

export const processRegister = async (req, res) => {

  try {

    const filePath = req.file.path;
    const example={
    name: req.body.name,
    id: req.body.studentId,
    email: req.body.gsuiteEmail,
    department: req.body.department,
    UserName: req.body.username,
    password: req.body.password,
    DateOfBirth: req.body.dob,
    profilePic: filePath
    };
    const value = await User.create(example);
    console.log("User registered Successfully");
    return res.status(201).json({ 
      message: "Registration successful!",
      redirectTo: "/api/login" // Client-side JS will read this and navigate
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(400).json({ error: "Error has happened during registration", details: err.message });
  }
};