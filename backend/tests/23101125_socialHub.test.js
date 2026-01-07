// socialHub.test.js
import request from "supertest";
import app from "../index.js"; // Your main app file
import User from "../models/UserModel.js";
import Friend from "../models/FriendModel.js";
import mongoose from "mongoose";

describe("Feature: Social Hub - Friend Management (ID: SH-2025)", () => {
  let authToken = "";
  let testUserId = "";
  let friendUserId = "";
  let anotherUserId = "";
  let friendRequestId = "";

  // PRE-CONDITION: Setup test users and authentication
  beforeAll(async () => {
    // Clean up existing test data
    await User.deleteMany({ email: /test.*@socialtest\.com/ });
    await Friend.deleteMany({});

    // Create test users
    const testUser = await User.create({
      name: "Test User",
      email: "testuser@socialtest.com",
      UserName: "testuser123",
      password: "password123", // Will be hashed by pre-save hook
      student_id: "TEST001",
      department: "CSE",
      DateOfBirth: "2000-01-01",
    });
    testUserId = testUser._id.toString();

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

    // Login to get auth token (adjust endpoint based on your auth setup)
    const loginResponse = await request(app).post("/api/login").send({
      username: "testuser123",
      password: "password123",
    });

    // Extract session cookie or token based on your auth mechanism
    authToken = loginResponse.headers["set-cookie"];
  });

  // CLEANUP: Remove test data after all tests
  afterAll(async () => {
    await User.deleteMany({ email: /test.*@socialtest\.com/ });
    await Friend.deleteMany({});
    await mongoose.connection.close();
  });

  //! TEST GROUP 1: Social Hub Page Access

  describe("GET /api/dashboard/social - Access Social Hub Page", () => {
    it("should load social hub page for authenticated user", async () => {
      const res = await request(app)
        .get("/api/dashboard/social")
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("Social Hub"); // Check if page renders
    });

    it("should redirect to login if not authenticated", async () => {
      const res = await request(app).get("/api/dashboard/social");

      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toContain("/login");
    });
  });

  //! TEST GROUP 2: User Search

  describe("GET /api/dashboard/social/search - Search Users", () => {
    it("should search users by name", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "Friend" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("users");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.users[0]).toHaveProperty("name", "Friend User");
    });

    it("should search users by username", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "frienduser" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.users[0]).toHaveProperty("username", "frienduser123");
    });

    it("should return empty array for no matches", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "NonExistentUser999" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(0);
    });

    it("should return empty array for empty query", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(0);
    });

    it("should exclude current user from search results", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "Test User" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.every((u) => u._id !== testUserId)).toBe(true);
    });

    it("should limit search results to 5 users", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/search")
        .query({ query: "user" })
        .set("Cookie", authToken);

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
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.users.every((u) => u.department === "CSE")).toBe(true);
    });

    it("should return error if department is missing", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/filter")
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should exclude current user from filtered results", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/filter")
        .query({ department: "CSE" })
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.every((u) => u._id !== testUserId)).toBe(true);
    });
  });

  //! TEST GROUP 4: Send Friend Request

  describe("POST /api/dashboard/social/friend-request - Send Friend Request", () => {
    it("should send friend request successfully", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authToken)
        .send({ recipientId: friendUserId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Friend request sent successfully"
      );

      // Store request ID for later tests
      const friendRequest = await Friend.findOne({
        requester: testUserId,
        recipient: friendUserId,
      });
      friendRequestId = friendRequest._id.toString();
    });

    it("should return error if recipient ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authToken)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if trying to send request to self", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authToken)
        .send({ recipientId: testUserId });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty(
        "error",
        "Cannot send friend request to yourself"
      );
    });

    it("should return error if friend request already exists", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authToken)
        .send({ recipientId: friendUserId });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Friend request already exists");
    });

    it("should return error if recipient does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/friend-request")
        .set("Cookie", authToken)
        .send({ recipientId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });

  //! TEST GROUP 5: Get Pending Requests

  describe("GET /api/dashboard/social/requests/pending - Get Pending Friend Requests", () => {
    it("should get list of pending requests", async () => {
      // Login as friend user to see pending request
      const friendLogin = await request(app)
        .post("/api/login")
        .send({ username: "frienduser123", password: "password123" });

      const friendCookie = friendLogin.headers["set-cookie"];

      const res = await request(app)
        .get("/api/dashboard/social/requests/pending")
        .set("Cookie", friendCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("requests");
      expect(Array.isArray(res.body.requests)).toBe(true);
      expect(res.body.requests.length).toBeGreaterThan(0);
      expect(res.body.requests[0].requester).toHaveProperty(
        "username",
        "testuser123"
      );
    });

    it("should return empty array if no pending requests", async () => {
      // Login as another user who has no requests
      const anotherLogin = await request(app)
        .post("/api/login")
        .send({ username: "anotheruser123", password: "password123" });

      const anotherCookie = anotherLogin.headers["set-cookie"];

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
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("requests");
      expect(res.body.requests.length).toBeGreaterThan(0);
      expect(res.body.requests[0].recipient).toHaveProperty(
        "username",
        "frienduser123"
      );
    });
  });

  //! TEST GROUP 7: Accept Friend Request

  describe("POST /api/dashboard/social/accept-request - Accept Friend Request", () => {
    it("should accept friend request successfully", async () => {
      // Login as friend user to accept request
      const friendLogin = await request(app)
        .post("/api/login")
        .send({ username: "frienduser123", password: "password123" });

      const friendCookie = friendLogin.headers["set-cookie"];

      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", friendCookie)
        .send({ requestId: friendRequestId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Friend request accepted successfully"
      );

      // Verify in database
      const friendship = await Friend.findById(friendRequestId);
      expect(friendship.status).toBe("accepted");
    });

    it("should return error if request ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authToken)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if request does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authToken)
        .send({ requestId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if non-recipient tries to accept", async () => {
      // Create another request
      await Friend.create({
        requester: anotherUserId,
        recipient: friendUserId,
        status: "pending",
      });

      const res = await request(app)
        .post("/api/dashboard/social/accept-request")
        .set("Cookie", authToken)
        .send({ requestId: friendRequestId });

      expect(res.statusCode).toEqual(404);
    });
  });

  //! TEST GROUP 8: Get Friend List

  describe("GET /api/dashboard/social/friends - Get Friend List", () => {
    it("should get list of accepted friends", async () => {
      const res = await request(app)
        .get("/api/dashboard/social/friends")
        .set("Cookie", authToken);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("friends");
      expect(Array.isArray(res.body.friends)).toBe(true);
      expect(res.body.friends.length).toBeGreaterThan(0);
      expect(res.body.friends[0]).toHaveProperty("username", "frienduser123");
    });

    it("should return empty array if no friends", async () => {
      // Login as another user who has no friends
      const anotherLogin = await request(app)
        .post("/api/login")
        .send({ username: "anotheruser123", password: "password123" });

      const anotherCookie = anotherLogin.headers["set-cookie"];

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
        .set("Cookie", authToken)
        .send({ requestId: newRequestId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);

      // Verify in database
      const request = await Friend.findById(newRequestId);
      expect(request).toBeNull();
    });

    it("should return error if request ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/cancel-request")
        .set("Cookie", authToken)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if request not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/cancel-request")
        .set("Cookie", authToken)
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
        .set("Cookie", authToken)
        .send({ friendId: friendUserId });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Friend removed successfully");

      // Verify in database
      const friendship = await Friend.findOne({
        $or: [
          { requester: testUserId, recipient: friendUserId },
          { requester: friendUserId, recipient: testUserId },
        ],
      });
      expect(friendship).toBeNull();
    });

    it("should return error if friend ID is missing", async () => {
      const res = await request(app)
        .post("/api/dashboard/social/remove-friend")
        .set("Cookie", authToken)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return error if friendship not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/dashboard/social/remove-friend")
        .set("Cookie", authToken)
        .send({ friendId: fakeId.toString() });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "Friendship not found");
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
        expect(res.statusCode).toEqual(302); // Redirect to login
      }
    });
  });
});
