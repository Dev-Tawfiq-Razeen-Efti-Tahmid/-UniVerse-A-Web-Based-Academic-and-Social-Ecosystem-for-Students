import User from "../models/UserModel.js";

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

    // Fetch fresh user data from database
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
        // profilePic: user.profilePic,
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
    const { username, currentPassword, newPassword, confirmPassword } =
      req.body;

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

    // Check if username is taken by another user
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

    // If changing password
    if (newPassword || currentPassword) {
      // Validate all password fields are provided
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.render("profileUpdate", {
          user: req.session.userData,
          error: "Please fill all password fields",
          success: null,
        });
      }

      // Check if current password matches
      if (user.password !== currentPassword) {
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

      // Check password length
      // if (newPassword.length < 6) {
      //   return res.render("profileUpdate", {
      //     user: req.session.userData,
      //     error: "Password must be at least 6 characters",
      //     success: null,
      //   });
      // }

      // Update password
      user.password = newPassword; // In production, use bcrypt to hash this!
    }

    // Update username
    user.UserName = username;

    // Save changes
    await user.save();

    // Update session data
    req.session.userData.username = username;

    res.render("profileUpdate", {
      user: {
        _id: user._id,
        name: user.name,
        username: user.UserName,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        // profilePic: user.profilePic,
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
