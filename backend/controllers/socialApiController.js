import User from "../models/UserModel.js";

// Show EJS page
export const showSocialHub = (req, res) => {
  if (!req.session?.userData) {
    return res.redirect("/api/login");
  }
  res.render("socialHub"); // Your EJS filename
};

// 1️⃣ Search users
export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q;

    const users = await User.find(
      { name: { $regex: q, $options: "i" } },
      { password: 0 } // don't return password
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
};

// 2️⃣ Get friend list
export const getFriendList = async (req, res) => {
  try {
    const userId = req.session?.userData?._id;

    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const user = await User.findById(userId)
      .populate("friends", "name UserName profilePic")
      .lean();

    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ error: "Cannot load friend list" });
  }
};

// 3️⃣ Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.session?.userData?._id;
    const targetId = req.params.targetUserId;

    if (!senderId) return res.status(401).json({ error: "Not logged in" });

    await User.findByIdAndUpdate(targetId, {
      $addToSet: { friendRequests: senderId },
    });

    res.json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send request" });
  }
};

// 4️⃣ Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.session?.userData?._id;
    const requesterId = req.params.requesterId;

    // Add each other as friends
    await User.findByIdAndUpdate(receiverId, {
      $addToSet: { friends: requesterId },
      $pull: { friendRequests: requesterId },
    });

    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: receiverId },
    });

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept request" });
  }
};

// 5️⃣ Decline friend request
export const declineFriendRequest = async (req, res) => {
  try {
    const receiverId = req.session?.userData?._id;
    const requesterId = req.params.requesterId;

    await User.findByIdAndUpdate(receiverId, {
      $pull: { friendRequests: requesterId },
    });

    res.json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline request" });
  }
};
