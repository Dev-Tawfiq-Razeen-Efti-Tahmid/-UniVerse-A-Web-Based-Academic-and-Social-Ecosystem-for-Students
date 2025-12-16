// Show planner page
export const showPlanner = (req, res) => {
  try {
    const userData = req.session?.userData;

    // Check if user is authenticated and has a student_id
    if (!userData || !userData.student_id) {
      return res.redirect("/api/login");
    }

    console.log("[DEBUG] userData in showPlanner:", userData);
    // Render the planner template with user data
    res.render("planner", {
      userId: userData.student_id,
      username: userData.username || userData.name || "Student",
    });
  } catch (error) {
    console.error("Error rendering planner:", error);
    res.status(500).json({ error: "Failed to render planner" });
  }
};
