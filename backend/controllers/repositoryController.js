export const renderRepositoryPage = (req, res) => {
  try {
    if (!req.session?.userData) {
      return res.redirect("/api/login");
    }

    res.render("repository", {
      user: req.session.userData,
      error: null,
    });
  } catch (err) {
    console.error("Error loading repository:", err);
    res.status(500).json({ error: "Failed to load repository" });
  }
};
