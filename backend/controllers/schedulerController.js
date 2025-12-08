import SchedulerModel from "../models/SchedulerModel.js";
import NotificationModel from "../models/NotificationModel.js";

// Helper function to auto-create notifications for a task
export const autoCreateNotifications = async (taskId, deadline, userId) => {
  try {
    // Define reminder times: 3 days, 1 day, 1 hour before deadline
    const reminders = [
      { type: "3days", minutesBefore: 3 * 24 * 60 },
      { type: "1day", minutesBefore: 24 * 60 },
      { type: "1hour", minutesBefore: 60 },
    ];

    for (const reminder of reminders) {
      const scheduledFor = new Date(
        deadline.getTime() - reminder.minutesBefore * 60000
      );

      // Check if notification already exists
      const exists = await NotificationModel.findOne({
        taskId,
        reminderType: reminder.type,
      });

      if (!exists) {
        const now = new Date();
        const notificationSent = scheduledFor <= now; // Mark as sent if time has passed

        await NotificationModel.create({
          userId,
          taskId,
          taskTitle: "Task",
          taskDeadline: deadline,
          reminderType: reminder.type,
          scheduledFor,
          notificationSent,
          sentAt: notificationSent ? now : null,
        });
      }
    }
  } catch (error) {
    console.error("Error auto-creating notifications:", error);
  }
};

// Add a new task
export const addTask = async (req, res) => {
  console.log("[DEBUG] /api/scheduler/add req.body:", req.body);
  try {
    const { userId, title, description, deadline, priority, category, tags } =
      req.body;

    if (!userId || !title || !deadline) {
      return res
        .status(400)
        .json({ error: "Missing required fields: userId, title, deadline" });
    }

    const newTask = await SchedulerModel.create({
      userId,
      title,
      description: description || "",
      deadline: new Date(deadline),
      priority: priority || "medium",
      category: category || "assignment",
      tags: tags || [],
    });

    // Auto-create notifications for this task
    await autoCreateNotifications(newTask._id, newTask.deadline, userId);

    res.status(201).json({ message: "Task added successfully", task: newTask });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Failed to add task" });
  }
};

// Get all tasks for a user
export const getTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const tasks = await SchedulerModel.find({ userId })
      .sort({ deadline: 1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    const updatedTask = await SchedulerModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    // Also delete associated notifications
    await NotificationModel.deleteMany({ taskId });

    const deletedTask = await SchedulerModel.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Mark task as complete
export const markAsComplete = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "taskId is required" });
    }

    const updatedTask = await SchedulerModel.findByIdAndUpdate(
      taskId,
      {
        completed: true,
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task marked as complete", task: updatedTask });
  } catch (error) {
    console.error("Error marking task as complete:", error);
    res.status(500).json({ error: "Failed to mark task as complete" });
  }
};
