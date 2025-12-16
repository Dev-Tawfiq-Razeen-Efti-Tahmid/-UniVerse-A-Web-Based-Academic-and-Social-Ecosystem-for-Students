import User from "../models/UserModel.js";
import path from "path";

export const showLogin = async (req, res) => {
  try {
    if (req.session?.userData) {
      return  res.redirect("/api/dashboard");
    }
    res.render("loginpage", { error: null });
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};

export const processLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const store= await User.findOne({ UserName: username, password: password });
    
    if (store) {
      const data = {
        _id: store._id,
        userId: store._id.toString(),
        username: store.UserName,
        name: store.name,
        email: store.email,
        student_id: store.student_id,
        department: store.department,
        DateOfBirth: store.DateOfBirth, // Still needs work to function properly
        profilePic: store.profilePic,
        role: store.role
      };
      req.session.userData = data;
      console.log("[DEBUG] Logged in role:", data.role);

      if (data.role === "admin") {
          return res.redirect("/api/admin/dashboard");
      }

      return res.redirect("/api/dashboard");
      
    }
    else{
      res.render("loginpage", { error: "Invalid username or password" });
    }

  } catch (err) {
    res.render("loginpage", { error: "An error occurred during login. Please try again." });
  }
};
