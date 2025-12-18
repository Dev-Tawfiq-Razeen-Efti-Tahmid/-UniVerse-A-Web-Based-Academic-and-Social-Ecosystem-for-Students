import mongoose from "mongoose";

const downloadHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

downloadHistorySchema.index({ user: 1, downloadedAt: -1 });

export default mongoose.model("DownloadHistory", downloadHistorySchema);
