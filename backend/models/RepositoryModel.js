import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    courseCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    semester: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    voteScore: { type: Number, default: 0 },

    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Optional: Index for faster searching
repositorySchema.index({ courseCode: 1, semester: 1, voteScore: -1 });

export default mongoose.model("Repository", repositorySchema);
export const apiRepositoryTree = async (req, res) => {
  try {
    const resources = await Repository.find({})
      .sort({ createdAt: -1 })
      .select("title courseCode semester department originalFileName fileUrl createdAt uploadedBy voteScore downloadCount");

    const tree = {};
    for (const r of resources) {
      const dept = r.department || "UNKNOWN";
      const sem = r.semester || "UNKNOWN";
      const course = r.courseCode || "UNKNOWN";

      if (!tree[dept]) tree[dept] = {};
      if (!tree[dept][sem]) tree[dept][sem] = {};
      if (!tree[dept][sem][course]) tree[dept][sem][course] = [];

      tree[dept][sem][course].push(r);
    }

    return res.json({ tree });
  } catch (err) {
    console.error("Tree API error:", err);
    return res.status(500).json({ error: "Failed to load tree" });
  }
};
