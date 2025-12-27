export const showRoutine = (req, res) => {
    try {
        const userData = req.session?.userData;

        // Check if user is authenticated
        if (!userData) {
            return res.redirect("/api/login");
        }

        // Render the routine template with user data
        res.render("routine", {
            userId: userData._id || userData.userId,
            username: userData.username || "Student",
        });
    } catch (error) {
        console.error("Error rendering routine:", error);
        res.status(500).json({ error: "Failed to render routine" });
    }
};
