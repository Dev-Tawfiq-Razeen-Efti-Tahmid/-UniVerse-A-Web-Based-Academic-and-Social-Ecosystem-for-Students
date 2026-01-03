import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import {
  checkSuspensionExpiry,
  getSuspensionInfo,
} from "../utils/suspensionUtils.js";

export const showLogin = async (req, res) => {
  try {
    if (req.session?.userData) {
      return res.redirect("/api/dashboard");
    }
    res.render("loginpage", { error: null });
  } catch (err) {
    res.status(500).json({ error: "Login page not delivered" });
  }
};

export const processLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const store = await User.findOne({ UserName: username });

    if (!store) {
      return res.render("loginpage", { error: "Invalid username or password" });
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, store.password);

    if (!isPasswordValid) {
      return res.render("loginpage", { error: "Invalid username or password" });
    }

    // Check account status and auto-reactivate if suspension expired
    const { isExpired, user: updatedUser } = await checkSuspensionExpiry(store);
    const currentUser = updatedUser;

    if (currentUser.accountStatus === "banned") {
      return res.render("loginpage", {
        error:
          "Your account has been banned. Please contact support for more information.",
      });
    }

    if (currentUser.accountStatus === "suspended") {
      const suspensionInfo = getSuspensionInfo(currentUser);
      const message = suspensionInfo.daysRemaining
        ? `Your account has been suspended for ${
            suspensionInfo.daysRemaining
          } days ${suspensionInfo.hoursRemaining % 24} hours. Reason: ${
            suspensionInfo.reason || "Account suspended by admin"
          }`
        : `Your account has been permanently suspended. Reason: ${
            suspensionInfo.reason || "Account suspended by admin"
          }`;

      return res.render("loginpage", { error: message });
    }

    const data = {
      _id: currentUser._id,
      userId: currentUser._id.toString(),
      username: currentUser.UserName,
      name: currentUser.name,
      email: currentUser.email,
      student_id: currentUser.student_id,
      department: currentUser.department,
      DateOfBirth: currentUser.DateOfBirth,
      profilePic: currentUser.profilePic,
      role: currentUser.role,
      accountStatus: currentUser.accountStatus,
    };
    req.session.userData = data;
    console.log("[DEBUG] Logged in role:", data.role);

    if (data.role === "admin") {
      return res.redirect("/api/admin/landing");
    }

    return res.redirect("/api/dashboard");
  } catch (err) {
    console.error("[ERROR] Login error:", err);
    res.render("loginpage", {
      error: "An error occurred during login. Please try again.",
    });
  }
};
