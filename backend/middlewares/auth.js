export const requireLogin = (req, res, next) => {
  if (!req.session?.userData) return res.redirect("/api/login");
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session?.userData) return res.redirect("/api/login");
  if (req.session.userData.role !== "admin") return res.status(403).send("Forbidden");
  next();
};
