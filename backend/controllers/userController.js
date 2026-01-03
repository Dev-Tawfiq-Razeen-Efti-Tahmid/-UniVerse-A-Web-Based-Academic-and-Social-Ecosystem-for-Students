import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Users" });
  }
};

export const createUser = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "name and email required" });
  try {
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const showProfilePage = async (req, res) => {
  try {
    if (!req.session?.userData) {
      return res.redirect("/api/login");
    }

    // Fetch user data
    const user = await User.findById(req.session.userData._id);

    if (!user) {
      return res.redirect("/api/login");
    }

    res.render("profileUpdate", {
      user: {
        _id: user._id,
        name: user.name,
        username: user.UserName,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
      },
      error: null,
      success: null,
    });
  } catch (err) {
    console.error("Error loading profile page:", err);
    res.status(500).json({ error: "Failed to load profile page" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const {
      username,
      currentPassword,
      newPassword,
      confirmPassword,
      department,
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.render("profileUpdate", {
        user: req.session.userData,
        error: "User not found",
        success: null,
      });
    }

    // Validation
    if (!username || username.trim().length === 0) {
      return res.render("profileUpdate", {
        user: req.session.userData,
        error: "Username cannot be empty",
        success: null,
      });
    }

    // Check if username is taken
    if (username !== user.UserName) {
      const existingUser = await User.findOne({ UserName: username });
      if (existingUser) {
        return res.render("profileUpdate", {
          user: req.session.userData,
          error: "Username already taken",
          success: null,
        });
      }
    }
    //department
    if (!department || department.trim().length === 0) {
      return res.render("profileUpdate", {
        user: req.session.userData,
        error: "Department cannot be empty",
        success: null,
      });
    }

    // If changing password
    if (newPassword || currentPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.render("profileUpdate", {
          user: req.session.userData,
          error: "Please fill all password fields",
          success: null,
        });
      }

      // Verify current password using bcrypt
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return res.render("profileUpdate", {
          user: req.session.userData,
          error: "Current password is incorrect",
          success: null,
        });
      }

      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        return res.render("profileUpdate", {
          user: req.session.userData,
          error: "New passwords do not match",
          success: null,
        });
      }

      user.password = newPassword;
    }
    user.department = department;
    user.UserName = username;

    await user.save();

    // Update session data
    req.session.userData.username = username;
    req.session.userData.department = department;

    res.render("profileUpdate", {
      user: {
        _id: user._id,
        name: user.name,
        username: user.UserName,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
      },
      error: null,
      success: "Profile updated successfully!",
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.render("profileUpdate", {
      user: req.session.userData,
      error: "Failed to update profile. Please try again.",
      success: null,
    });
  }
};
