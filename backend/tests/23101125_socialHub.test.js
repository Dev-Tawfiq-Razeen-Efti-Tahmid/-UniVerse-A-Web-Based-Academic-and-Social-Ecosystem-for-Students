import request from "supertest";
import { app } from "../index.js";
import User from "../models/UserModel.js";
import Friend from "../models/FriendModel.js";
import mongoose from "mongoose";

describe("Feature: Social Hub - Friend Management (ID: SH-2025)", () => {
  let authCookie = "";
  let testUserId = "";
  let friendUserId = "";
  let anotherUserId = "";
  let friendRequestId = "";

  // Helper function to login and get session cookie
  async function loginUser(username, password) {
    const res = await request(app)
      .post("/api/login")
      .send({ username, password });
    return res.headers["set-cookie"];
  }

  beforeAll(async () => {
    // Wait for DB connection
    while (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clean up existing test data FIRST
    await User.deleteMany({
      $or: [{ email: /test.*@socialtest\.com/ }, { student_id: /^TEST\d+$/ }],
    });
    await Friend.deleteMany({});

    console.log("🧹 Cleaned existing test data");

    try {
      const testUser = await User.create({
        name: "Test User",
        email: "testuser@socialtest.com",
        UserName: "testuser123",
        password: "password123",
        student_id: "TEST001",
        department: "CSE",
        DateOfBirth: "2000-01-01",
      });
      testUserId = testUser._id.toString();
      console.log("✅ Test user created:", testUserId);

      const friendUser = await User.create({
        name: "Friend User",
        email: "frienduser@socialtest.com",
        UserName: "frienduser123",
        password: "password123",
        student_id: "TEST002",
        department: "CSE",
        DateOfBirth: "2000-01-02",
      });
      friendUserId = friendUser._id.toString();
      console.log("✅ Friend user created:", friendUserId);

      const anotherUser = await User.create({
        name: "Another User",
        email: "anotheruser@socialtest.com",
        UserName: "anotheruser123",
        password: "password123",
        student_id: "TEST003",
        department: "EEE",
        DateOfBirth: "2000-01-03",
      });
      anotherUserId = anotherUser._id.toString();
      console.log("✅ Another user created:", anotherUserId);

      authCookie = await loginUser("testuser123", "password123");
      console.log("✅ Auth cookie obtained");
    } catch (error) {
      console.error("❌ Error creating test users:", error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({
      $or: [{ email: /test.*@socialtest\.com/ }, { student_id: /^TEST\d+$/ }],
    });
    await Friend.deleteMany({});
    console.log("✅ Test data cleaned up");
  });

  //! TEST GROUP 1: Social Hub Page Access

  describe("GET /api/dashboard/social - Access Social Hub Page", () => {
    it("should load social hub page for authenticated user", async () => {
      const res = await request(app)
        .get("/api/dashboard/social")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("Social Hub");
    });

    it("should redirect to login if not authenticated", async () => {
      const res = await request(app).get("/api/dashboard/social");

      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toContain("login");
    });
  });

  //! TEST GROUP 2: User Search

  describe("GET /api/dashboard/social/search - Search Users", () => {
    it("should search users by name", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "Friend" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("users");
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should search users by username", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "frienduser" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "NonExistentUser999" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(0);
    });

    it("should return empty array for empty query", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(0);
    });

    it("should exclude current user from search results", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "Test User" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      if (res.body.users.length > 0) {
        expect(res.body.users.every((u) => u._id !== testUserId)).toBe(true);
      }
    });

    it("should limit search results to 5 users", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "user" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.length).toBeLessThanOrEqual(5);
    });
  });

  //! TEST GROUP 3: Filter Search by Department

  describe("GET /api/dashboard/social/filter - Filter Users by Department", () => {
    it("should filter users by department", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/filter")
        .query({ department: "CSE" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      if (res.body.users.length > 0) {
        expect(res.body.users.every((u) => u.department === "CSE")).toBe(true);
      }
    });

    it("should return error if department is missing", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/filter")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should exclude current user from filtered results", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/filter")
        .query({ department: "CSE" })
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      if (res.body.users.length > 0) {
        expect(res.body.users.every((u) => u._id !== testUserId)).toBe(true);
      }
    });
  });

  //! TEST GROUP 4: Send Friend Request

  describe("POST /api/dashboard/social/friend-request - Send Friend Request", () => {
    it("should send friend request successfully", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authCookie)
        .send({ recipientId: friendUserId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);

      // Store request ID for later tests
      const friendRequest = await Friend.findOne({
        requester: testUserId,
        recipient: friendUserId,
      });
      if (friendRequest) {
        friendRequestId = friendRequest._id.toString();
      }
    });

    it("should return error if recipient ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authCookie)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if trying to send request to self", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authCookie)
        .send({ recipientId: testUserId });

      expect(res.statusCode).toEqual(400);
    });

    it("should return error if friend request already exists", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authCookie)
        .send({ recipientId: friendUserId });

      expect(res.statusCode).toEqual(400);
    });
  });

  //! TEST GROUP 5: Get Pending Requests

  describe("GET /api/dashboard/social/requests/pending - Get Pending Friend Requests", () => {
    it("should get list of pending requests", async () => {
      const friendCookie = await loginUser("frienduser123", "password123");

      const res = await request(app)
        .get("/api/dashboard/social/requests/pending")
        .set("Cookie", friendCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("requests");
      expect(Array.isArray(res.body.requests)).toBe(true);
    });

    it("should return empty array if no pending requests", async () => {
      const anotherCookie = await loginUser("anotheruser123", "password123");

      const res = await request(app)
        .get("/api/dashboard/social/requests/pending")
        .set("Cookie", anotherCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.requests).toHaveLength(0);
    });
  });

  //! TEST GROUP 6: Get Sent Requests

  describe("GET /api/dashboard/social/requests/sent - Get Sent Friend Requests", () => {
    it("should get list of sent requests", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/requests/sent")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("requests");
    });
  });

  //! TEST GROUP 7: Accept Friend Request

  describe("POST /api/dashboard/social/accept-request - Accept Friend Request", () => {
    it("should accept friend request successfully", async () => {
      const friendCookie = await loginUser("frienduser123", "password123");

      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", friendCookie)
        .send({ requestId: friendRequestId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should return error if request ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authCookie)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if request does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authCookie)
        .send({ requestId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
    });

    it("should return error if non-recipient tries to accept", async () => {
      // Create another request
      const newRequest = await Friend.create({
        requester: anotherUserId,
        recipient: friendUserId,
        status: "pending",
      });

      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authCookie)
        .send({ requestId: newRequest._id.toString() });

      expect(res.statusCode).toEqual(404);
    });
  });

  //! TEST GROUP 8: Get Friend List

  describe("GET /api/dashboard/social/friends - Get Friend List", () => {
    it("should get list of accepted friends", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/friends")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("friends");
    });

    it("should return empty array if no friends", async () => {
      const anotherCookie = await loginUser("anotheruser123", "password123");

      const res = await request(app)
        .get("/api/dashboard/social/friends")
        .set("Cookie", anotherCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.friends).toHaveLength(0);
    });
  });

  //! TEST GROUP 9: Cancel Friend Request

  describe("POST /api/dashboard/social/cancel-request - Cancel Sent Friend Request", () => {
    let newRequestId = "";

    beforeAll(async () => {
      // Create a new pending request
      const newRequest = await Friend.create({
        requester: testUserId,
        recipient: anotherUserId,
        status: "pending",
      });
      newRequestId = newRequest._id.toString();
    });

    it("should cancel sent friend request successfully", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/cancel-request")
        .set("Cookie", authCookie)
        .send({ requestId: newRequestId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should return error if request ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/cancel-request")
        .set("Cookie", authCookie)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if request not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/cancel-request")
        .set("Cookie", authCookie)
        .send({ requestId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  //! TEST GROUP 10: Remove Friend

  describe("POST /api/dashboard/social/remove-friend - Remove Friend", () => {
    it("should remove friend successfully", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/remove-friend")
        .set("Cookie", authCookie)
        .send({ friendId: friendUserId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should return error if friend ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/remove-friend")
        .set("Cookie", authCookie)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if friendship not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/remove-friend")
        .set("Cookie", authCookie)
        .send({ friendId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  //! TEST GROUP 11: Authentication Tests

  describe("Authentication & Authorization Tests", () => {
    it("should deny access to all endpoints without authentication", async () => {
      const endpoints = [
        { method: "get", path: "/api/dashboard/social" },
        { method: "get", path: "/api/dashboard/social/search?query=test" },
        { method: "get", path: "/api/dashboard/social/filter?department=CSE" },
        { method: "get", path: "/api/dashboard/social/friends" },
        { method: "get", path: "/api/dashboard/social/requests/pending" },
        { method: "post", path: "/api/dashboard/social/friend-request" },
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)[endpoint.method](endpoint.path);
        expect(res.statusCode).toEqual(302);
      }
    });
  });
});
