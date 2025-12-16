import User from "../models/UserModel.js";
import Friend from "../models/FriendModel.js";

// Social Hub page
export const showSocialHub = async (req, res) => {
  try {
    if (!req.session?.userData) {
      return res.redirect("/api/login");
    }

    res.render("socialHub", {
      user: req.session.userData,
      error: null,
    });
  } catch (err) {
    console.error("Error loading social hub:", err);
    res.status(500).json({ error: "Failed to load social hub" });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.session.userData._id;

    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Search by name or username
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: "i" } },
        { UserName: { $regex: query, $options: "i" } },
      ],
    })
      .select("name UserName student_id department profilePic")
      .limit(5);

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friend.findOne({
          $or: [
            { requester: currentUserId, recipient: user._id },
            { requester: user._id, recipient: currentUserId },
          ],
        });

        let friendStatus = "none";
        let requestId = null;

        if (friendship) {
          requestId = friendship._id;
          if (friendship.status === "accepted") {
            friendStatus = "friends";
          } else if (friendship.requester.toString() === currentUserId) {
            friendStatus = "requested"; // Current user sent the request
          } else {
            friendStatus = "pending"; // Current user received the request
          }
        }

        return {
          _id: user._id,
          name: user.name,
          username: user.UserName,
          student_id: user.student_id,
          department: user.department,
          profilePic: user.profilePic,
          friendStatus: friendStatus,
          requestId: requestId,
        };
      })
    );

    res.json({ users: usersWithStatus });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// Get friend list (only accepted friends)
export const getFriendList = async (req, res) => {
  try {
    const currentUserId = req.session.userData._id;

    const friendships = await Friend.find({
      $or: [
        { requester: currentUserId, status: "accepted" },
        { recipient: currentUserId, status: "accepted" },
      ],
    })
      .populate("requester", "name UserName student_id department profilePic")
      .populate("recipient", "name UserName student_id department profilePic");

    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === currentUserId
          ? friendship.recipient
          : friendship.requester;

      return {
        _id: friend._id,
        name: friend.name,
        username: friend.UserName,
        student_id: friend.student_id,
        department: friend.department,
        profilePic: friend.profilePic,
        friendshipId: friendship._id,
      };
    });

    res.json({ success: true, friends });
  } catch (err) {
    console.error("Error fetching friend list:", err);
    res.status(500).json({ error: "Failed to fetch friend list" });
  }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.session.userData._id;

    // Validation
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (requesterId === recipientId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if request already exists (in either direction)
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return res.status(400).json({ error: "You are already friends" });
      } else if (existingRequest.status === "pending") {
        return res.status(400).json({ error: "Friend request already exists" });
      }
    }

    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await friendRequest.save();

    res.json({
      success: true,
      message: "Friend request sent successfully",
      requestId: friendRequest._id,
    });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ error: "Failed to send friend request" });
  }
};

// Accept friend request (only recipient can accept)
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.session.userData._id;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    // Find the friend request
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: currentUserId,
      status: "pending",
    });

    if (!friendRequest) {
      return res.status(404).json({
        error: "Friend request not found or you cannot accept this request",
      });
    }

    // Update status to accepted
    friendRequest.status = "accepted";
    await friendRequest.save();

    res.json({
      success: true,
      message: "Friend request accepted successfully",
    });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
};

// Reject/Cancel friend request or Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.session.userData._id;

    if (!friendId) {
      return res.status(400).json({ error: "Friend ID is required" });
    }

    // Delete friendship (works for pending, accepted, or rejected)
    const result = await Friend.findOneAndDelete({
      $or: [
        { requester: currentUserId, recipient: friendId },
        { requester: friendId, recipient: currentUserId },
      ],
    });

    if (!result) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    res.json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (err) {
    console.error("Error removing friend:", err);
    res.status(500).json({ error: "Failed to remove friend" });
  }
};

// Get pending friend requests (requests sent TO current user)
export const getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.session.userData._id;

    const pendingRequests = await Friend.find({
      recipient: currentUserId,
      status: "pending",
    })
      .populate("requester", "name UserName student_id department profilePic")
      .sort({ createdAt: -1 });

    const requests = pendingRequests.map((request) => ({
      _id: request._id,
      requester: {
        _id: request.requester._id,
        name: request.requester.name,
        username: request.requester.UserName,
        student_id: request.requester.student_id,
        department: request.requester.department,
        profilePic: request.requester.profilePic,
      },
      createdAt: request.createdAt,
    }));

    res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

// Get sent requests (requests sent BY current user)
export const getSentRequests = async (req, res) => {
  try {
    const currentUserId = req.session.userData._id;

    const sentRequests = await Friend.find({
      requester: currentUserId,
      status: "pending",
    })
      .populate("recipient", "name UserName student_id department profilePic")
      .sort({ createdAt: -1 });

    const requests = sentRequests.map((request) => ({
      _id: request._id,
      recipient: {
        _id: request.recipient._id,
        name: request.recipient.name,
        username: request.recipient.UserName,
        student_id: request.recipient.student_id,
        department: request.recipient.department,
        profilePic: request.recipient.profilePic,
      },
      createdAt: request.createdAt,
    }));

    res.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (err) {
    console.error("Error fetching sent requests:", err);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
};

// Cancel sent friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.session.userData._id;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    // Delete the request (only if current user is the requester)
    const result = await Friend.findOneAndDelete({
      _id: requestId,
      requester: currentUserId,
      status: "pending",
    });

    if (!result) {
      return res
        .status(404)
        .json({ error: "Request not found or already processed" });
    }

    res.json({
      success: true,
      message: "Friend request cancelled successfully",
    });
  } catch (err) {
    console.error("Error cancelling friend request:", err);
    res.status(500).json({ error: "Failed to cancel friend request" });
  }
};
