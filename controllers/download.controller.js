//controllers/download.controller.js
const service = require("../services/download.service");

exports.downloadByUuid = async (req, res) => {
  try {
    await service.handleDownloadByUuid(req, res);
  } catch (err) {
    console.error("DOWNLOAD UUID ERROR", err);
    res.status(500).json({ message: "Download failed" });
  }
};

exports.downloadByFilename = async (req, res) => {
  try {
    await service.handleDownloadByFilename(req, res);
  } catch (err) {
    console.error("DOWNLOAD FILENAME ERROR", err);
    res.status(500).json({ message: "Download failed" });
  }
};
