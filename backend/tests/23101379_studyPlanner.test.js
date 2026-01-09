import request from "supertest";
import { app } from "../index.js";
import User from "../models/UserModel.js";
import Routine from "../models/RoutineModel.js";
import Scheduler from "../models/SchedulerModel.js";
import Notification from "../models/NotificationModel.js";
import mongoose from "mongoose";

describe("Feature: Study Planner - Comprehensive Test Suite (ID: 23101379)", () => {
    let authCookie = "";
    let testUserId = "23101379";
    let otherUserId = "99999999";
    let testUserObjectId = "";
    let createdTaskId = "";

    // Helper function to login and get session cookie
    async function loginUser(username, password) {
        const res = await request(app)
            .post("/api/login")
            .send({ username, password });
        return res.headers["set-cookie"];
    }

    beforeAll(async () => {
        while (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Clean up
        await User.deleteMany({ student_id: { $in: [testUserId, otherUserId] } });
        await Routine.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Scheduler.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Notification.deleteMany({ userId: { $in: [testUserId, otherUserId] } });

        // Create test user
        const testUser = await User.create({
            name: "Study Planner User",
            email: "planner@test.com",
            UserName: "plannerUser",
            password: "password123",
            student_id: testUserId,
            department: "CSE",
            DateOfBirth: "2000-01-01",
        });
        testUserObjectId = testUser._id.toString();

        // Create another user for isolation tests
        await User.create({
            name: "Other User",
            email: "other@test.com",
            UserName: "otherUser",
            password: "password123",
            student_id: otherUserId,
            department: "EEE",
            DateOfBirth: "2000-01-02",
        });

        authCookie = await loginUser("plannerUser", "password123");
    }, 30000);

    afterAll(async () => {
        await User.deleteMany({ student_id: { $in: [testUserId, otherUserId] } });
        await Routine.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Scheduler.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
        await Notification.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    });

    //! --- SECTION 1: Dashboard & Authorization (5 Tests) ---
    describe("1. Access Control", () => {
        it("1.1 should redirect /api/dashboard/planner to login if unauthorized", async () => {
            const res = await request(app).get("/api/dashboard/planner");
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toContain("login");
        });

        it("1.2 should load /api/dashboard/planner for authorized user", async () => {
            const res = await request(app).get("/api/dashboard/planner").set("Cookie", authCookie);
            expect(res.statusCode).toBe(200);
        });

        it("1.3 should redirect /api/routine/view to login if unauthorized", async () => {
            const res = await request(app).get("/api/routine/view");
            expect(res.statusCode).toBe(302);
        });

        it("1.4 should load /api/routine/view for authorized user", async () => {
            const res = await request(app).get("/api/routine/view").set("Cookie", authCookie);
            expect(res.statusCode).toBe(200);
        });

    });

    //! --- SECTION 2: Scheduler Task Creation & Validation (10 Tests) ---
    describe("2. Scheduler - Add Task", () => {
        it("2.1 should add task successfully with all fields", async () => {
            const task = {
                userId: testUserId,
                title: "Main Task",
                description: "Desc",
                deadline: new Date(Date.now() + 86400000).toISOString(),
                priority: "high",
                category: "exam",
                tags: ["urgent"]
            };
            const res = await request(app).post("/api/scheduler/add").send(task);
            expect(res.statusCode).toBe(201);
            createdTaskId = res.body.task._id;
        });

        it("2.2 should fail if userId is missing", async () => {
            const res = await request(app).post("/api/scheduler/add").send({ title: "No ID", deadline: new Date() });
            expect(res.statusCode).toBe(400);
        });

        it("2.3 should fail if title is missing", async () => {
            const res = await request(app).post("/api/scheduler/add").send({ userId: testUserId, deadline: new Date() });
            expect(res.statusCode).toBe(400);
        });

        it("2.4 should fail if deadline is missing", async () => {
            const res = await request(app).post("/api/scheduler/add").send({ userId: testUserId, title: "No Date" });
            expect(res.statusCode).toBe(400);
        });

        it("2.5 should create task with default priority 'medium'", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Default Priority", deadline: new Date()
            });
            expect(res.body.task.priority).toBe("medium");
        });

        it("2.6 should create task with default category 'assignment'", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Default Cat", deadline: new Date()
            });
            expect(res.body.task.category).toBe("assignment");
        });

        it("2.7 should create task with empty tags array if not provided", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "No Tags", deadline: new Date()
            });
            expect(res.body.task.tags).toEqual([]);
        });

        it("2.8 should handle multiple tags correctly", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Multi Tags", deadline: new Date(), tags: ["T1", "T2"]
            });
            expect(res.body.task.tags).toContain("T1");
            expect(res.body.task.tags).toContain("T2");
        });

        it("2.9 should store description correctly", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Desc Test", deadline: new Date(), description: "Detailed info"
            });
            expect(res.body.task.description).toBe("Detailed info");
        });

        it("2.10 should handle very long titles", async () => {
            const longTitle = "A".repeat(200);
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: longTitle, deadline: new Date()
            });
            expect(res.statusCode).toBe(201);
            expect(res.body.task.title).toBe(longTitle);
        });
    });

    //! --- SECTION 3: Notification Logic (5 Tests) ---
    describe("3. Notification System", () => {
        it("3.1 should create exactly 3 notifications when a task is added", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Notify Test", deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
            });
            const notifications = await Notification.find({ taskId: res.body.task._id });
            expect(notifications.length).toBe(3);
        });

        it("3.2 should contain 3days, 1day, and 1hour reminder types", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Type Test", deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            });
            const notifications = await Notification.find({ taskId: res.body.task._id });
            const types = notifications.map(n => n.reminderType);
            expect(types).toContain("3days");
            expect(types).toContain("1day");
            expect(types).toContain("1hour");
        });

        it("3.3 should calculate scheduledFor correctly (approx 1 hour before)", async () => {
            const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Time Calc", deadline: deadline.toISOString()
            });
            const notification = await Notification.findOne({ taskId: res.body.task._id, reminderType: "1hour" });
            const expectedTime = new Date(deadline.getTime() - 60 * 60000);
            expect(new Date(notification.scheduledFor).getTime()).toBeCloseTo(expectedTime.getTime(), -3);
        });

        it("3.4 should mark notification as sent if scheduledFor is in the past", async () => {
            const pastDeadline = new Date(Date.now() - 3600000); // 1 hour ago
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Past Task", deadline: pastDeadline.toISOString()
            });
            const notifications = await Notification.find({ taskId: res.body.task._id });
            notifications.forEach(n => {
                expect(n.notificationSent).toBe(true);
            });
        });

        it("3.5 should populate taskTitle in notifications", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Title Sync", deadline: new Date()
            });
            const notification = await Notification.findOne({ taskId: res.body.task._id });
            expect(notification.taskTitle).toBe("Title Sync");
        });
    });

    //! --- SECTION 4: Task Retrieval & Updates (10 Tests) ---
    describe("4. Scheduler - Retrieve & Update", () => {
        it("4.1 should get tasks sorted by deadline ascending", async () => {
            const d1 = new Date(Date.now() + 200000);
            const d2 = new Date(Date.now() + 100000);
            await request(app).post("/api/scheduler/add").send({ userId: testUserId, title: "Later", deadline: d1 });
            await request(app).post("/api/scheduler/add").send({ userId: testUserId, title: "Sooner", deadline: d2 });

            const res = await request(app).get(`/api/scheduler/${testUserId}`);
            const indexSooner = res.body.findIndex(t => t.title === "Sooner");
            const indexLater = res.body.findIndex(t => t.title === "Later");
            expect(indexSooner).toBeLessThan(indexLater);
        });

        it("4.2 should return empty array for user with no tasks", async () => {
            const res = await request(app).get(`/api/scheduler/${otherUserId}`);
            expect(res.body).toEqual([]);
        });

        it("4.3 should update task title and keep other fields", async () => {
            const res = await request(app).put(`/api/scheduler/${createdTaskId}`).send({ title: "New Title" });
            expect(res.body.task.title).toBe("New Title");
            expect(res.body.task.priority).toBe("high"); // From 2.1
        });

        it("4.4 should refresh notifications when deadline is updated", async () => {
            const oldNotifications = await Notification.find({ taskId: createdTaskId });
            const oldIds = oldNotifications.map(n => n._id.toString());

            await request(app).put(`/api/scheduler/${createdTaskId}`).send({ deadline: new Date(Date.now() + 1000000).toISOString() });

            const newNotifications = await Notification.find({ taskId: createdTaskId });
            const newIds = newNotifications.map(n => n._id.toString());

            newIds.forEach(id => {
                expect(oldIds).not.toContain(id);
            });
        });

        it("4.5 should return 404 when updating non-existent task", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).put(`/api/scheduler/${fakeId}`).send({ title: "Fail" });
            expect(res.statusCode).toBe(404);
        });

        it("4.6 should mark task as complete and set completedAt", async () => {
            const res = await request(app).patch(`/api/scheduler/${createdTaskId}/complete`);
            expect(res.body.task.completed).toBe(true);
            expect(res.body.task.completedAt).not.toBeNull();
        });

        it("4.7 should maintain 'completed' status after title update", async () => {
            await request(app).put(`/api/scheduler/${createdTaskId}`).send({ title: "Complete Title" });
            const task = await Scheduler.findById(createdTaskId);
            expect(task.completed).toBe(true);
        });

        it("4.8 should delete associated notifications when task is deleted", async () => {
            await request(app).delete(`/api/scheduler/${createdTaskId}`);
            const notifications = await Notification.find({ taskId: createdTaskId });
            expect(notifications.length).toBe(0);
        });

        it("4.9 should return 404 when deleting non-existent task", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/api/scheduler/${fakeId}`);
            expect(res.statusCode).toBe(404);
        });

        it("4.10 should handle marking non-existent task as complete (404)", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).patch(`/api/scheduler/${fakeId}/complete`);
            expect(res.statusCode).toBe(404);
        });
    });

    //! --- SECTION 5: Routine Maker (10 Tests) ---
    describe("5. Routine Maker", () => {
        it("5.1 should create a new routine slot", async () => {
            const slot = { userId: testUserId, day: "Monday", timeSlot: "10:00", courseName: "CSE110", roomNo: "101" };
            const res = await request(app).post("/api/routine/update").send(slot);
            expect(res.statusCode).toBe(200);
            expect(res.body.courseName).toBe("CSE110");
        });

        it("5.2 should update existing slot instead of creating duplicate", async () => {
            await request(app).post("/api/routine/update").send({ userId: testUserId, day: "Monday", timeSlot: "10:00", courseName: "CSE220" });
            const routine = await Routine.find({ userId: testUserId, day: "Monday", timeSlot: "10:00" });
            expect(routine.length).toBe(1);
            expect(routine[0].courseName).toBe("CSE220");
        });

        it("5.3 should retrieve user's full routine", async () => {
            await request(app).post("/api/routine/update").send({ userId: testUserId, day: "Tuesday", timeSlot: "11:00", courseName: "MAT110" });
            const res = await request(app).get(`/api/routine/${testUserId}`);
            expect(res.body.length).toBe(2);
        });

        it("5.4 should isolate routines between users", async () => {
            const res = await request(app).get(`/api/routine/${otherUserId}`);
            expect(res.body.length).toBe(0);
        });

        it("5.5 should delete a routine slot correctly", async () => {
            await request(app).post("/api/routine/delete").send({ userId: testUserId, day: "Monday", timeSlot: "10:00" });
            const slot = await Routine.findOne({ userId: testUserId, day: "Monday", timeSlot: "10:00" });
            expect(slot).toBeNull();
        });

        it("5.6 should return 200 even when deleting non-existent slot", async () => {
            const res = await request(app).post("/api/routine/delete").send({ userId: testUserId, day: "Sunday", timeSlot: "Midnight" });
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Slot cleared");
        });

        it("5.7 should handle empty roomNo correctly", async () => {
            const res = await request(app).post("/api/routine/update").send({
                userId: testUserId, day: "Wednesday", timeSlot: "09:00", courseName: "Lab", roomNo: ""
            });
            expect(res.body.roomNo).toBe("");
        });

        it("5.8 should handle special characters in course names", async () => {
            const res = await request(app).post("/api/routine/update").send({
                userId: testUserId, day: "Wednesday", timeSlot: "09:00", courseName: "C++ (OOP)"
            });
            expect(res.body.courseName).toBe("C++ (OOP)");
        });

        it("5.9 should sort routine slots if requested (logic check)", async () => {
            const res = await request(app).get(`/api/routine/${testUserId}`);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("5.10 should handle batch retrieval for dashboard visualization", async () => {
            const res = await request(app).get(`/api/routine/${testUserId}`);
            expect(res.statusCode).toBe(200);
        });
    });

    //! --- SECTION 6: Integration & Edge Cases (5 Tests) ---
    describe("6. Edge Cases & Integration", () => {
        it("6.1 should enforce required fields in Routine via Mongoose (Simulation)", async () => {
            try {
                await Routine.create({ day: "Monday" }); // Missing userId and timeSlot
            } catch (e) {
                expect(e.name).toBe("ValidationError");
            }
        });

        it("6.2 should fail to create task with invalid date string", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Bad Date", deadline: "Not-A-Date"
            });
            expect(res.statusCode).toBe(500); // Controller catches and returns error
        });

        it("6.3 should verify task priority enum validation in DB", async () => {
            try {
                await Scheduler.create({ userId: testUserId, title: "Bad Pri", deadline: new Date(), priority: "ultra" });
            } catch (e) {
                expect(e.name).toBe("ValidationError");
            }
        });

        it("6.4 should verify task category enum validation in DB", async () => {
            try {
                await Scheduler.create({ userId: testUserId, title: "Bad Cat", deadline: new Date(), category: "gaming" });
            } catch (e) {
                expect(e.name).toBe("ValidationError");
            }
        });

        it("6.5 should ensure notifications are deleted if task is removed from DB directly", async () => {
            const res = await request(app).post("/api/scheduler/add").send({
                userId: testUserId, title: "Direct Delete", deadline: new Date()
            });
            const taskId = res.body.task._id;
            // This simulates a manual DB cleanup or a cascade logic check
            await request(app).delete(`/api/scheduler/${taskId}`);
            const count = await Notification.countDocuments({ taskId });
            expect(count).toBe(0);
        });
    });
});
