// import Chat from "../models/chatModel.js";
// import User from "../models/UserModel.js";
// import Friend from "../models/FriendModel.js";

// // Show chat page
// export const showChatPage = async (req, res) => {
//   try {
//     if (!req.session?.userData) {
//       return res.redirect("/api/login");
//     }

//     res.render("chat", {
//       user: req.session.userData,
//       error: null,
//     });
//   } catch (err) {
//     console.error("Error loading chat page:", err);
//     res.status(500).json({ error: "Failed to load chat page" });
//   }
// };

// // Get list of friends for sidebar
// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const currentUserId = req.session.userData._id;

//     // Get all accepted friendships
//     const friendships = await Friend.find({
//       $or: [
//         { requester: currentUserId, status: "accepted" },
//         { recipient: currentUserId, status: "accepted" },
//       ],
//     })
//       .populate("requester", "name UserName profilePic")
//       .populate("recipient", "name UserName profilePic");

//     // Extract friend data
//     const friends = friendships.map((friendship) => {
//       const friend =
//         friendship.requester._id.toString() === currentUserId
//           ? friendship.recipient
//           : friendship.requester;

//       return {
//         _id: friend._id,
//         name: friend.name,
//         username: friend.UserName,
//         profilePic: friend.profilePic,
//       };
//     });

//     res.json({ success: true, friends });
//   } catch (err) {
//     console.error("Error fetching friends:", err);
//     res.status(500).json({ error: "Failed to fetch friends" });
//   }
// };

// // Get messages with a specific user
// export const getMessages = async (req, res) => {
//   try {
//     const { id: friendId } = req.params;
//     const currentUserId = req.session.userData._id;

//     // Get all messages between current user and friend
//     const messages = await Chat.find({
//       $or: [
//         { senderId: currentUserId, receiverId: friendId },
//         { senderId: friendId, receiverId: currentUserId },
//       ],
//     })
//       .sort({ createdAt: 1 }) // Oldest first
//       .populate("senderId", "name profilePic")
//       .populate("receiverId", "name profilePic");

//     res.json({ success: true, messages });
//   } catch (err) {
//     console.error("Error fetching messages:", err);
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// };

// // Send a message
// export const sendMessage = async (req, res) => {
//   try {
//     const { id: receiverId } = req.params;
//     const { text } = req.body;
//     const senderId = req.session.userData._id;

//     if (!text || text.trim().length === 0) {
//       return res.status(400).json({ error: "Message cannot be empty" });
//     }

//     // Create new message
//     const newMessage = new Chat({
//       senderId,
//       receiverId,
//       text: text.trim(),
//     });

//     await newMessage.save();

//     // Populate sender and receiver info
//     await newMessage.populate("senderId", "name profilePic");
//     await newMessage.populate("receiverId", "name profilePic");

//     res.json({ success: true, message: newMessage });
//   } catch (err) {
//     console.error("Error sending message:", err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// };

//Gemini

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
