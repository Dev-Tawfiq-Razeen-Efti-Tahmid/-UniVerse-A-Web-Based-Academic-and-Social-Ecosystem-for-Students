import connectDB from "./config/db.js";  // ✅ import your db.js

const PORT = process.env.PORT || 5000;

// Connect DB + start server
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`✅ API running on http://localhost:${PORT}`)
  );
});
