import router from "../routes/users";

export const showSocialHub = (req, res) => {
  const userData = req.session?.userData;

  if (!userData) {
    return res.redirect("/api/login");
  }

  res.render("socialHub", {
    user: userData,
  });
};
