//routes/download.routes.js
const express = require("express");
const controller = require("../controllers/download.controller");

const router = express.Router();

// Friendly: /api/download/f/<domain>/<filename>
router.get("/f/:domain/:filename", controller.downloadByFilename);

// UUID: /api/download/<uuid>
router.get("/:identifier", controller.downloadByUuid);

module.exports = router;
