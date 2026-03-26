//controllers/upload.controller.js

const service = require("../services/upload.service");

exports.upload = async (req, res) => {
  try {
    const result = await service.handleUpload(req);
    res.json(result);
  } catch (e) {
    console.error("UPLOAD ERROR", e);
    res.status(e.statusCode || 500).json({ message: e.message || "Upload failed" });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await service.handleUpdate(req);
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.handleDelete(req);
    res.json({ message: "File deleted successfully" });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.restore = async (req, res) => {
  try {
    const result = await service.handleRestore(req);
    res.json({ message: "File restored successfully", ...result });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
