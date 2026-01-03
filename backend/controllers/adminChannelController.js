import channelObj from "../models/channel.js";

/**
 * Show channel management page
 */
export const showChannelManagement = async (req, res) => {
  try {
    res.render("adminChannelManagement", {
      username: req.session.userData.username,
    });
  } catch (err) {
    console.error("Channel management page error:", err);
    res.status(500).send("Failed to load channel management page");
  }
};

/**
 * Search for channels
 * Query parameters: query (search string)
 */
export const searchChannels = async (req, res) => {
  try {
    const { query } = req.query;
    let searchFilter = {};

    if (query && query.trim()) {
      // Search in channel name, description, or owner
      searchFilter = {
        $or: [
          { channelName: { $regex: query, $options: "i" } },
          { channelDescription: { $regex: query, $options: "i" } },
          { ChannelOwner: { $regex: query, $options: "i" } },
        ],
      };
    }

    const channels = await channelObj
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      channels,
      count: channels.length,
    });
  } catch (err) {
    console.error("Search channels error:", err);
    res.json({
      success: false,
      message: "Error searching channels",
      error: err.message,
    });
  }
};

/**
 * Delete a channel by ID
 */
export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Find the channel to verify it exists
    const channel = await channelObj.findById(channelId);
    if (!channel) {
      return res.json({
        success: false,
        message: "Channel not found",
      });
    }

    // Delete the channel
    await channelObj.findByIdAndDelete(channelId);

    // Log the action
    console.log(
      `Admin ${req.session.userData.username} deleted channel: ${channel.channelName} (ID: ${channelId})`
    );

    res.json({
      success: true,
      message: `Channel "${channel.channelName}" has been successfully deleted`,
      deletedChannel: channel.channelName,
    });
  } catch (err) {
    console.error("Delete channel error:", err);
    res.json({
      success: false,
      message: "Error deleting channel",
      error: err.message,
    });
  }
};

/**
 * Get statistics about channels
 */
export const getChannelStats = async (req, res) => {
  try {
    const totalChannels = await channelObj.countDocuments();
    const channels = await channelObj.find().lean();

    const stats = {
      totalChannels,
      averageActiveCount:
        totalChannels > 0
          ? channels.reduce((sum, ch) => sum + (ch.ChannelActiveCount || 0), 0) /
            totalChannels
          : 0,
      totalUpvotes: channels.reduce((sum, ch) => sum + (ch.ChannelUpvote || 0), 0),
      totalDownvotes: channels.reduce((sum, ch) => sum + (ch.ChannelDownvote || 0), 0),
      mostActiveChannel: channels.sort(
        (a, b) => (b.ChannelActiveCount || 0) - (a.ChannelActiveCount || 0)
      )[0],
    };

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error("Get channel stats error:", err);
    res.json({
      success: false,
      message: "Error fetching channel statistics",
      error: err.message,
    });
  }
};
