// import mongoose from "mongoose";
// import dotenv from "dotenv";
// // Load environment variables
// dotenv.config();
// // Increase timeout for DB operations
// // jest.setTimeout(30000);
// // Connect to test DB before all tests
// beforeAll(async () => {
//   const testDbUri =
//     process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/universe_test";
//   try {
//     await mongoose.connect(testDbUri); // No options needed in Mongoose 7+
//     console.log("✅ Connected to test database");
//   } catch (err) {
//     console.error("❌ Failed to connect to MongoDB:", err);
//     process.exit(1); // Stop tests if DB connection fails
//   }
// });
// // Disconnect after all tests
// afterAll(async () => {
//   await mongoose.connection.dropDatabase();
//   await mongoose.connection.close();
//   console.log("Disconnected from test database");
// });

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to test DB before all tests
beforeAll(async () => {
  const testDbUri =
    process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/universe_test";

  try {
    // Close existing connections if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    await mongoose.connect(testDbUri);
    console.log("✅ Connected to test database");

    // Clear all collections before starting tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log("🧹 Cleared all test data");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}, 30000); // 30 second timeout

// Disconnect after all tests
afterAll(async () => {
  try {
    // Drop the database
    await mongoose.connection.dropDatabase();
    console.log("🗑️ Test database dropped");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Disconnected from test database");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  }
}, 30000);
