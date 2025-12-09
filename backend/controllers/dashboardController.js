// backend/controllers/dashboardController.js

export const showdashBoard = (req, res) => {
  const userData = req.session?.userData;

  // If user is not logged in → redirect to login page
  if (!userData) {
    return res.redirect("/api/login");
  }

  // userData exists, so we can safely use username
  const username = userData.username;

  res.render("dashboard", { username });
};
