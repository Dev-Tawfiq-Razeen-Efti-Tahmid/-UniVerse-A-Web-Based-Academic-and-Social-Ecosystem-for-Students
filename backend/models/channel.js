// backend/models/EventModel.js
import mongoose from "mongoose";

const ChannelInfo = new mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
      trim: true,
    },
    channelDescription: {
      type: String,
      required: false,
    },
    ChannelTags: {
      type: Array,
      required: false,
    },
    ChannelActiveCount: {
      type: Number,
      default: 0,
    },
    ChannelUpvote: {
      type: Number,
        default: 0,
    },
    ChannelDownvote: {
      type: Number,
        default: 0,
    },
    ChannelOwner: {
      type: String,
      required: true,
    },
    upvoters: {
      type: [String], // Array of usernames who upvoted
      default: [],
    },
    downvoters: {
      type: [String], // Array of usernames who downvoted
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const channelObj = mongoose.model("ChannelObj", ChannelInfo);

export default channelObj;
