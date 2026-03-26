//routes/upload.routes.js

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadController = require("../controllers/upload.controller");
// const uploadRateLimit = require("../middleware/uploadRateLimit");

const router = express.Router();


const authMiddleware = require("../middleware/auth");
const domainMiddleware = require("../middleware/domain");

const TMP_DIR = process.env.TMP_UPLOAD_DIR || "/tmp/reseapro_uploads";
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50 MB

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(TMP_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(TMP_DIR);
    cb(null, TMP_DIR);
  },
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, safe);
  },
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// POST   /api/upload            — upload a new file
router.post(
  "/",
  // uploadRateLimit,
  upload.single("file"),
  uploadController.upload
);

// PUT    /api/upload/:uuid       — replace file or update metadata
router.put("/:uuid", upload.single("file"), uploadController.update);

// DELETE /api/upload/:uuid       
router.put("/delete/:uuid", uploadController.remove);

// POST   /api/upload/:uuid/restore — restore a soft-deleted file
// router.post("/:uuid/restore", uploadController.restore);

module.exports = router;
