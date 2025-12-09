import User from "../models/UserModel.js";
import path from "path";

export const showLogin = async (req, res) => {
  try {
    res.render("loginpage",{});
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
        username: store.UserName,
        name: store.name,
        email: store.email,
        student_id: store.student_id, // Use student_id for all user references
        department: store.department,
        DateOfBirth: store.DateOfBirth, // Still needs work to function properly
        profilePic: store.profilePic
      };
      req.session.userData = data;
      console.log('[DEBUG] Session userData after login:', req.session.userData);
      req.session.visited=true;
      console.log("Session Data after login:", req.session.id);
      res.redirect('/api/dashboard');
      
    }
    else{
      res.message= "Invalid username or password";
      res.status(401).json({ message: "Invalid username or password" });
    }

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
