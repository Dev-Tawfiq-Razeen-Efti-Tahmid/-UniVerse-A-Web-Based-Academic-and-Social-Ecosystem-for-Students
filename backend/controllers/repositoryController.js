import Repository from "../models/RepositoryModel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import DownloadHistory from "../models/DownloadHistoryModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/public (always correct)
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// ---------- PAGE ----------
export const renderRepositoryPage = (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    return res.render("repository", {
      user: req.session.userData,
      error: null,
    });
  } catch (err) {
    console.error("Error loading repository:", err);
    return res.status(500).send("Failed to load repository");
  }
};

// ---------- SEARCH API (JSON) ----------
export const apiSearchResources = async (req, res) => {
  try {
    const { q, department, semester } = req.query;

    const filter = {};

    // q matches courseCode OR title OR original filename (better UX)
    if (q && q.trim()) {
      const term = q.trim();
      filter.$or = [
        { courseCode: { $regex: term, $options: "i" } },
        { title: { $regex: term, $options: "i" } },
        { originalFileName: { $regex: term, $options: "i" } },
      ];
    }

    if (department && department.trim()) {
      filter.department = { $regex: department.trim(), $options: "i" };
    }
    if (semester && semester.trim()) {
      filter.semester = semester.trim();
    }

    const resources = await Repository.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "title courseCode semester department originalFileName fileUrl createdAt uploadedBy voteScore downloadCount"
      );

    return res.json({ resources });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
};

// ---------- TREE API (JSON): Department → Semester → Course ----------
export const apiRepositoryTree = async (req, res) => {
  try {
    // Optional: allow quick narrowing
    const { department, semester } = req.query;

    const filter = {};
    if (department && department.trim()) {
      filter.department = { $regex: department.trim(), $options: "i" };
    }
    if (semester && semester.trim()) {
      filter.semester = semester.trim();
    }

    // Pull everything needed for UI
    const resources = await Repository.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "title courseCode semester department originalFileName fileUrl createdAt uploadedBy voteScore downloadCount"
      );

    // Build nested tree
    const tree = {};
    for (const r of resources) {
      const dept = r.department || "UNKNOWN";
      const sem = (r.semester || "UNKNOWN")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

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

// ---------- DOWNLOAD ----------
export const downloadResource = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const resource = await Repository.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    // "/uploads/repository/xxx.zip" -> "uploads/repository/xxx.zip"
    const relative = (resource.fileUrl || "").replace(/^\//, "");
    const absolutePath = path.join(PUBLIC_DIR, relative);

    if (!fs.existsSync(absolutePath)) {
      console.log("❌ File missing:", absolutePath);
      return res.status(404).send("File missing on server");
    }

    // ✅ EXTRA: Log download history (do not block download if logging fails)
    DownloadHistory.create({
      user: req.session.userData._id,
      resource: resource._id,
    }).catch(() => {});

    // Increment download count (don’t block download if this fails)
    Repository.updateOne(
      { _id: resource._id },
      { $inc: { downloadCount: 1 } }
    ).catch(() => {});

    return res.download(absolutePath, resource.originalFileName || "download");
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).send("Download failed");
  }
};

export const renderMyUploadsPage = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const userId = req.session.userData._id;

    console.log("MY UPLOADS user:", userId); // ✅ LOG SESSION USER

    const resources = await Repository.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .select(
        "title courseCode semester department originalFileName fileUrl createdAt uploadedBy"
      );

    resources.forEach((r) => {
      console.log("Resource:", r.courseCode, r.uploadedBy); // ✅ LOG RESOURCE OWNER
    });

    return res.render("myUploads", {
      user: req.session.userData,
      resources,
      error: null,
    });
  } catch (err) {
    console.error("My uploads error:", err);
    return res.status(500).render("myUploads", {
      user: req.session?.userData,
      resources: [],
      error: "Failed to load your uploads",
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const userId = String(req.session.userData._id);
    const userRole = String(req.session.userData.role || "").toLowerCase();
    const isAdmin = userRole === "admin";

    const resource = await Repository.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    const isOwner = String(resource.uploadedBy) === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).send("Not allowed to delete this resource");
    }

    const relative = (resource.fileUrl || "").replace(/^\//, "");
    const absolutePath = path.join(PUBLIC_DIR, relative);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Repository.findByIdAndDelete(req.params.id);

    return res.redirect("/api/repository/my-uploads");
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).send("Delete failed");
  }
};

// =====================
// ✅ EXTRA: MY DOWNLOADS
// =====================

export const renderMyDownloadsPage = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const userId = req.session.userData._id;

    const downloads = await DownloadHistory.find({ user: userId })
      .sort({ downloadedAt: -1 })
      .populate("resource");

    const safeDownloads = downloads.filter((d) => d.resource);

    return res.render("myDownloads", {
      user: req.session.userData,
      downloads: safeDownloads,
      error: null,
    });
  } catch (err) {
    console.error("My downloads error:", err);
    return res.status(500).render("myDownloads", {
      user: req.session?.userData,
      downloads: [],
      error: "Failed to load your downloads",
    });
  }
};

export const removeDownloadHistory = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const userId = String(req.session.userData._id);
    const history = await DownloadHistory.findById(req.params.id);

    if (!history) return res.redirect("/api/repository/my-downloads");

    if (String(history.user) !== userId) {
      return res.status(403).send("Not allowed");
    }

    await DownloadHistory.findByIdAndDelete(req.params.id);
    return res.redirect("/api/repository/my-downloads");
  } catch (err) {
    console.error("Remove download history error:", err);
    return res.status(500).send("Failed to remove history");
  }
};
