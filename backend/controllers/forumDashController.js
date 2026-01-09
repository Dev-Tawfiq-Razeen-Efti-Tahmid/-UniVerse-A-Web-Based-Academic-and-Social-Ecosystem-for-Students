
import channelObj from "../models/channel.js";
import Message from "../models/forumMessage.js";

// const channels = [
//     {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     },
//     // ... other channels
//         {
//         name: "Quantum Physics",
//         subject: "Advanced Theory",
//         // >>> MAKE SURE THIS PROPERTY EXISTS AND HAS A VALUE <<<
//         description: "A deep dive into quantum mechanics, field theory, and modern physics concepts.",
//         tags: ["physics", "science", "advanced"],
//         activeMembers: 152
//     }
//     // ... other channels
// ];


export const showForumDashboard = async (req, res) => {
  const userData = req.session?.userData;

  // If user is not logged in → redirect to login page
  if (!userData) {
    return res.redirect("/api/login");
  }
  const store = await channelObj.find({});
  const channels = [];
  for (let i = 0; i < store.length; i++) {
    const idString = store[i]._id.toString();
    const temp = {
      id: idString,
      name: store[i].channelName,
      active: store[i].ChannelActiveCount,
      tags: store[i].ChannelTags,
      description: store[i].channelDescription,
      owner: store[i].ChannelOwner,
      upvotes: store[i].ChannelUpvote || 0,
      downvotes: store[i].ChannelDownvote || 0,
      upvoters: store[i].upvoters || [],
      downvoters: store[i].downvoters || [],
    };
    channels.push(temp);
  }
  res.render("forumDash", { channels, user: userData });
};

// --- API: UPVOTE ---
export const upvoteChannel = async (req, res) => {
  try {
    const userData = req.session?.userData;
    if (!userData) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.id;
    const channel = await channelObj.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Check if user already upvoted
    if (channel.upvoters && channel.upvoters.includes(userData.username)) {
      return res.status(400).json({ error: "You already upvoted this channel" });
    }

    // Remove from downvoters
    const wasDownvoter = channel.downvoters && channel.downvoters.includes(userData.username);
    if (wasDownvoter) {
      channel.downvoters = channel.downvoters.filter(u => u !== userData.username);
      channel.ChannelDownvote = Math.max(0, channel.ChannelDownvote - 1);
    }

    // Add to upvoters
    if (!channel.upvoters) channel.upvoters = [];
    channel.upvoters.push(userData.username);
    channel.ChannelUpvote = (channel.ChannelUpvote || 0) + 1;

    await channel.save();
    return res.json({ upvotes: channel.ChannelUpvote, downvotes: channel.ChannelDownvote });
  } catch (err) {
    console.error("Upvote error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// --- API: DOWNVOTE ---
export const downvoteChannel = async (req, res) => {
  try {
    const userData = req.session?.userData;
    if (!userData) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.id;
    const channel = await channelObj.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Check if user already downvoted
    if (channel.downvoters && channel.downvoters.includes(userData.username)) {
      return res.status(400).json({ error: "You already downvoted this channel" });
    }

    // Remove from upvoters if present
    const wasUpvoter = channel.upvoters && channel.upvoters.includes(userData.username);
    if (wasUpvoter) {
      channel.upvoters = channel.upvoters.filter(u => u !== userData.username);
      channel.ChannelUpvote = Math.max(0, channel.ChannelUpvote - 1);
    }

    // Add to downvoters
    if (!channel.downvoters) channel.downvoters = [];
    channel.downvoters.push(userData.username);
    channel.ChannelDownvote = (channel.ChannelDownvote || 0) + 1;

    await channel.save();
    return res.json({ upvotes: channel.ChannelUpvote, downvotes: channel.ChannelDownvote });
  } catch (err) {
    console.error("Downvote error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// --- API: DELETE CHANNEL ---
export const deleteChannel = async (req, res) => {
  try {
    const userData = req.session?.userData;
    if (!userData) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.id;
    const channel = await channelObj.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    if (channel.ChannelOwner !== userData.username) {
      return res.status(403).json({ error: "Forbidden: not the owner" });
    }

    // Delete all messages associated with this channel
    await Message.deleteMany({ channel: channelId });
    
    // Delete the channel itself
    await channelObj.findByIdAndDelete(channelId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete channel error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// --- API: GET OWNED CHANNELS ---
export const getOwnedChannels = async (req, res) => {
  try {
    const userData = req.session?.userData;
    if (!userData) return res.status(401).json({ error: "Unauthorized" });

    const owned = await channelObj.find({ ChannelOwner: userData.username });
    const channels = owned.map(c => ({
      id: c._id.toString(),
      name: c.channelName,
      description: c.channelDescription,
      tags: c.ChannelTags || [],
      active: c.ChannelActiveCount || 0,
      upvotes: c.ChannelUpvote || 0,
      downvotes: c.ChannelDownvote || 0,
    }));

    return res.json({ channels });
  } catch (err) {
    console.error("Get owned channels error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

