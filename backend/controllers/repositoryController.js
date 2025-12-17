import Repository from "../models/RepositoryModel.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ always points to backend/public
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// RENDER PAGE
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

// SEARCH API (JSON)
export const apiSearchResources = async (req, res) => {
  try {
    const { q } = req.query;

    const filter = {};
    if (q && q.trim()) {
      filter.courseCode = { $regex: q.trim(), $options: "i" };
    }

    const resources = await Repository.find(filter)
      .sort({ createdAt: -1 })
      .select("title courseCode semester department originalFileName fileUrl createdAt");

    return res.json({ resources });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
};

// DOWNLOAD
export const downloadResource = async (req, res) => {
  try {
    if (!req.session?.userData) return res.redirect("/api/login");

    const resource = await Repository.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    // stored like "/uploads/repository/xxx.zip"
    const relative = (resource.fileUrl || "").replace(/^\//, "");
    const absolutePath = path.join(PUBLIC_DIR, relative);

    console.log("Download request:", {
      id: req.params.id,
      fileUrl: resource.fileUrl,
      absolutePath,
    });

    if (!fs.existsSync(absolutePath)) {
      console.log("❌ File missing:", absolutePath);
      return res.status(404).send("File missing on server");
    }

    return res.download(absolutePath, resource.originalFileName || "download");
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).send("Download failed");
  }
};
