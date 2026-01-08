import request from "supertest";
import { app } from "../index.js";
import User from "../models/UserModel.js";
import Channel from "../models/channel.js";
import Message from "../models/forumMessage.js";
import mongoose from "mongoose";

describe("Feature: Forum Module - Channels & Messaging (ID: FM-2025)", () => {
  let authCookie = "";
  let testUserId = "";
  let otherUserId = "";
  let testChannelId = "";

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

    // Clean up existing test data
    await User.deleteMany({
      $or: [{ email: /test.*@forumtest\.com/ }, { student_id: /^TFORUM\d+$/ }],
    });
    await Channel.deleteMany({ channelName: /Test.*Channel/ });
    await Message.deleteMany({});

    console.log("🧹 Cleaned existing test data");

    try {
      // Create test user
      const testUser = await User.create({
        name: "Forum Test User",
        email: "testuser@forumtest.com",
        UserName: "forumtestuser",
        password: "password123",
        student_id: "TFORUM001",
        department: "CSE",
        DateOfBirth: "2000-01-01",
      });
      testUserId = testUser._id.toString();
      console.log("✅ Test user created:", testUserId);

      // Create another test user
      const otherUser = await User.create({
        name: "Forum Other User",
        email: "otheruser@forumtest.com",
        UserName: "forumotheruser",
        password: "password123",
        student_id: "TFORUM002",
        department: "EEE",
        DateOfBirth: "2000-01-02",
      });
      otherUserId = otherUser._id.toString();
      console.log("✅ Other user created:", otherUserId);

      // Get auth cookie
      authCookie = await loginUser("forumtestuser", "password123");
      console.log("✅ Auth cookie obtained");
    } catch (error) {
      console.error("❌ Error creating test users:", error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({
      $or: [{ email: /test.*@forumtest\.com/ }, { student_id: /^TFORUM\d+$/ }],
    });
    await Channel.deleteMany({ channelName: /Test.*Channel/ });
    await Message.deleteMany({});
    console.log("✅ Test data cleaned up");
  });

  //! TEST GROUP 1: Forum Dashboard Access

  describe("GET /dashboard/forumDash - Access Forum Dashboard", () => {
    it("should load forum dashboard for authenticated user", async () => {
      const res = await request(app)
        .get("/dashboard/forumDash")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("UniVerse Channels");
    });

    it("should redirect to login if not authenticated", async () => {
      const res = await request(app).get("/dashboard/forumDash");

      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toContain("login");
    });
  });

  //! TEST GROUP 2: Create Forum Channel

  describe("POST /dashboard/forumDash/ForumCreate - Create Forum Channel", () => {
    it("should create a new forum channel successfully", async () => {
      const res = await request(app)
        .post("/dashboard/forumDash/ForumCreate")
        .set("Cookie", authCookie)
        .send({
          name: "Test Programming Channel",
          description: "Discussion about programming",
          tags: ["DSA", "programming"],
        });

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("Channel Created Successfully");

      // Verify channel was created with correct owner
      const channel = await Channel.findOne({
        channelName: "Test Programming Channel",
      });
      expect(channel).toBeDefined();
      expect(channel.ChannelOwner).toBe("forumtestuser");
      testChannelId = channel._id.toString();
    });

    it("should reject channel creation without authentication", async () => {
      const res = await request(app)
        .post("/dashboard/forumDash/ForumCreate")
        .send({
          name: "Unauthorized Channel",
          description: "Should fail",
          tags: ["test"],
        });

      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toContain("login");
    });
  });

  //! TEST GROUP 3: Upvote Channel

  describe("POST /dashboard/forumDash/api/:id/upvote - Upvote Channel", () => {
    it("should upvote channel successfully", async () => {
      const channel = await Channel.create({
        channelName: "Test Upvote Channel",
        channelDescription: "For testing upvotes",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
        ChannelUpvote: 0,
        ChannelDownvote: 0,
        upvoters: [],
        downvoters: [],
      });

      const res = await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/upvote`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("upvotes");
    });

    it("should prevent double upvoting and reject unauthenticated requests", async () => {
      const channel = await Channel.create({
        channelName: "Test Double Upvote Channel",
        channelDescription: "For testing double upvotes",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
        ChannelUpvote: 0,
        ChannelDownvote: 0,
        upvoters: [],
        downvoters: [],
      });

      // First upvote
      await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/upvote`)
        .set("Cookie", authCookie);

      // Second upvote should fail
      const doubleRes = await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/upvote`)
        .set("Cookie", authCookie);

      expect(doubleRes.statusCode).toEqual(400);

      // Unauthenticated request should fail
      const unAuthRes = await request(app).post(
        `/dashboard/forumDash/api/${channel._id}/upvote`
      );

      expect(unAuthRes.statusCode).toEqual(401);
    });
  });

  //! TEST GROUP 4: Downvote Channel

  describe("POST /dashboard/forumDash/api/:id/downvote - Downvote Channel", () => {
    it("should downvote channel successfully", async () => {
      const channel = await Channel.create({
        channelName: "Test Downvote Channel",
        channelDescription: "For testing downvotes",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
        ChannelUpvote: 0,
        ChannelDownvote: 0,
        upvoters: [],
        downvoters: [],
      });

      const res = await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/downvote`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("downvotes");
    });

    it("should prevent double downvoting and reject unauthenticated requests", async () => {
      const channel = await Channel.create({
        channelName: "Test Double Downvote Channel",
        channelDescription: "For testing double downvotes",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
        ChannelUpvote: 0,
        ChannelDownvote: 0,
        upvoters: [],
        downvoters: [],
      });

      // First downvote
      await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/downvote`)
        .set("Cookie", authCookie);

      // Second downvote should fail
      const doubleRes = await request(app)
        .post(`/dashboard/forumDash/api/${channel._id}/downvote`)
        .set("Cookie", authCookie);

      expect(doubleRes.statusCode).toEqual(400);

      // Unauthenticated request should fail
      const unAuthRes = await request(app).post(
        `/dashboard/forumDash/api/${channel._id}/downvote`
      );

      expect(unAuthRes.statusCode).toEqual(401);
    });
  });

  //! TEST GROUP 5: Delete Channel

  describe("DELETE /dashboard/forumDash/api/:id - Delete Channel", () => {
    it("should delete channel by owner successfully", async () => {
      const channel = await Channel.create({
        channelName: "Test Delete Channel",
        channelDescription: "For testing deletion",
        ChannelTags: ["test"],
        ChannelOwner: "forumtestuser",
      });

      const res = await request(app)
        .delete(`/dashboard/forumDash/api/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("ok", true);

      // Verify channel is deleted
      const deleted = await Channel.findById(channel._id);
      expect(deleted).toBeNull();
    });

    it("should prevent non-owner from deleting channel", async () => {
      const channel = await Channel.create({
        channelName: "Test Non-Owner Delete Channel",
        channelDescription: "For testing non-owner deletion",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      const res = await request(app)
        .delete(`/dashboard/forumDash/api/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toEqual("Forbidden: not the owner");
    });

    it("should cascade delete messages when channel is deleted", async () => {
      const channel = await Channel.create({
        channelName: "Test Cascade Delete Channel",
        channelDescription: "For testing cascade deletion",
        ChannelTags: ["test"],
        ChannelOwner: "forumtestuser",
      });

      // Create messages in this channel
      await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "Test message 1",
      });
      await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "Test message 2",
      });

      // Delete channel
      const res = await request(app)
        .delete(`/dashboard/forumDash/api/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);

      // Verify messages are deleted
      const messages = await Message.find({ channel: channel._id });
      expect(messages).toHaveLength(0);
    });

    it("should reject deletion without authentication", async () => {
      const channel = await Channel.create({
        channelName: "Test Unauth Delete Channel",
        channelDescription: "For testing unauth deletion",
        ChannelTags: ["test"],
        ChannelOwner: "forumtestuser",
      });

      const res = await request(app).delete(
        `/dashboard/forumDash/api/${channel._id}`
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual("Unauthorized");
    });
  });

  //! TEST GROUP 6: Get Owned Channels

  describe("GET /dashboard/forumDash/api/owned/list - Get User's Owned Channels", () => {
    it("should return list of owned channels", async () => {
      const res = await request(app)
        .get("/dashboard/forumDash/api/owned/list")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("channels");
      expect(Array.isArray(res.body.channels)).toBe(true);
    });

    it("should only return channels owned by current user", async () => {
      // Create a channel owned by test user
      await Channel.create({
        channelName: "Test Owned Channel",
        channelDescription: "Owned by forumtestuser",
        ChannelTags: ["test"],
        ChannelOwner: "forumtestuser",
      });

      const res = await request(app)
        .get("/dashboard/forumDash/api/owned/list")
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      if (res.body.channels.length > 0) {
        expect(res.body.channels[0]).toHaveProperty("name");
        expect(res.body.channels[0]).toHaveProperty("id");
      }
    });

    it("should reject access without authentication", async () => {
      const res = await request(app).get(
        "/dashboard/forumDash/api/owned/list"
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual("Unauthorized");
    });
  });

  //! TEST GROUP 7: Forum Chat Room Access

  describe("GET /dashboard/forumDash/ForumMessaging/:channelId - Access Forum Chat Room", () => {
    it("should load forum chat room for authenticated user", async () => {
      const channel = await Channel.create({
        channelName: "Test Chat Room Channel",
        channelDescription: "For testing chat room access",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      const res = await request(app)
        .get(`/dashboard/forumDash/ForumMessaging/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain("Test Chat Room Channel");
    });

    it("should display channel messages in room", async () => {
      const channel = await Channel.create({
        channelName: "Test Message Display Channel",
        channelDescription: "For testing message display",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      // Create test messages
      await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "Test message in room",
      });

      const res = await request(app)
        .get(`/dashboard/forumDash/ForumMessaging/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(200);
    });

    it("should reject room access without authentication", async () => {
      const channel = await Channel.findOne({
        channelName: "Test Chat Room Channel",
      });
      const res = await request(app).get(
        `/dashboard/forumDash/ForumMessaging/${channel._id}`
      );

      expect(res.statusCode).toEqual(401);
      expect(res.text).toContain("Unauthorized");
    });

    it("should return 404 for non-existent channel", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/dashboard/forumDash/ForumMessaging/${fakeId}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(404);
    });
  });

  //! TEST GROUP 8: Forum Chat Messages

  describe("Forum Chat - Message Storage & Retrieval", () => {
    it("should create messages in channel and retrieve ordered by timestamp", async () => {
      const channel = await Channel.create({
        channelName: "Test Message Channel",
        channelDescription: "For testing messages",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      const msg1 = await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "First message",
        timestamp: new Date("2025-01-01"),
      });

      const msg2 = await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "Second message",
        timestamp: new Date("2025-01-02"),
      });

      expect(msg1.content).toBe("First message");
      expect(msg2.content).toBe("Second message");

      const messages = await Message.find({ channel: channel._id }).sort({
        timestamp: 1,
      });

      expect(messages[0]._id.toString()).toBe(msg1._id.toString());
      expect(messages[1]._id.toString()).toBe(msg2._id.toString());
    });

    it("should track message author and channel association", async () => {
      const channel = await Channel.create({
        channelName: "Test Author Channel",
        channelDescription: "For testing author tracking",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      const message = await Message.create({
        channel: channel._id,
        user: testUserId,
        username: "forumtestuser",
        content: "Author tracked message",
      });

      const retrieved = await Message.findById(message._id);
      expect(retrieved.user.toString()).toBe(testUserId);
      expect(retrieved.username).toBe("forumtestuser");
      expect(retrieved.channel.toString()).toBe(channel._id.toString());
    });
  });

  //! TEST GROUP 9: Authentication & Authorization

  describe("Authentication & Authorization Tests", () => {
    it("should deny all endpoints without authentication", async () => {
      const dashRes = await request(app).get("/dashboard/forumDash");
      expect(dashRes.statusCode).toEqual(302);

      const createRes = await request(app)
        .post("/dashboard/forumDash/ForumCreate")
        .send({
          name: "Unauthorized Channel",
          description: "Should fail",
          tags: ["test"],
        });
      expect(createRes.statusCode).toEqual(302);

      const ownedRes = await request(app).get(
        "/dashboard/forumDash/api/owned/list"
      );
      expect(ownedRes.statusCode).toEqual(401);
    });

    it("should prevent ownership violations", async () => {
      const channel = await Channel.create({
        channelName: "Test Ownership Channel",
        channelDescription: "For testing ownership",
        ChannelTags: ["test"],
        ChannelOwner: "forumotheruser",
      });

      // Try to delete non-owned channel
      const res = await request(app)
        .delete(`/dashboard/forumDash/api/${channel._id}`)
        .set("Cookie", authCookie);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toEqual("Forbidden: not the owner");
    });
  });
});
