import FriendModel from "../models/FriendModel.js"; // Adjust path as needed
import ChatModel from "../models/ChatModel.js"; // Adjust path as needed
import User from "../models/UserModel.js"; // Adjust path as needed

// 1. Render Chat Page (Fetches friends for the sidebar)
export const renderChatPage = async (req, res) => {
  try {
    const currentUserId = req.session.userData._id;

    // Find all accepted friendships where the user is either requester or recipient
    const friendships = await FriendModel.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: "accepted",
    }).populate("requester recipient", "username name"); // Fetch names

    // Process the list to extract just the "Friend" info
    const friendsList = friendships.map((friendship) => {
      // If I am the requester, the friend is the recipient, and vice versa
      const isRequester = friendship.requester._id.toString() === currentUserId;
      return isRequester ? friendship.recipient : friendship.requester;
    });

    res.render("chat", {
      myId: currentUserId,
      myName: req.session.userData.name || req.session.userData.username,
      friends: friendsList,
    });
  } catch (error) {
    console.error("Error loading chat page:", error);
    res.status(500).send("Server Error");
  }
};

// 2. Fetch Chat History
export const getChatHistory = async (req, res) => {
  try {
    const myId = req.session.userData._id;
    const friendId = req.params.friendId;

    // Find messages between these two users (sent by either one)
    const messages = await ChatModel.find({
      $or: [
        { senderId: myId, receiverId: friendId },
        { senderId: friendId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// 3. Save Message to DB
export const saveChatMessage = async (req, res) => {
  try {
    const senderId = req.session.userData._id;
    const { receiverId, text } = req.body;

    const newMessage = new ChatModel({
      senderId,
      receiverId,
      text,
    });

    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};
