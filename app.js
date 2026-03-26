//app.js
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cron = require("node-cron");

// 🔐 Load env safely (Enhance compatible)
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

if (!process.env.PORT) {
  console.error(".env not loaded. Check path or permissions.");
  process.exit(1);
}

const domainMiddleware = require("./middleware/domain");
const authMiddleware = require("./middleware/auth");

const uploadRoutes = require("./routes/upload.routes");
const downloadRoutes = require("./routes/download.routes");
const downloadController = require("./controllers/download.controller");
const cleanupService = require("./services/cleanup.service");


const app = express();
app.set("trust proxy", true);


// CRITICAL: Set trust proxy BEFORE any middleware
//app.set('trust proxy', 1); 

/* ---------------- SECURITY ---------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------- CORS ---------------- */

app.use(
  cors({
    origin: [
      "https://dev.reseaprojournals.com",
      "https://www.dev.reseaprojournals.com",
      "https://dev.cms.reseaprojournals.com",
      "https://www.dev.cms.reseaprojournals.com",
      "https://dev.ccs.reseaprojournals.com",
      "https://www.dev.ccs.reseaprojournals.com",
      "https://dev.blogcms.reseaprojournals.com",
      "http://localhost:4000",
      "http://localhost:4003",
      "http://localhost:4014",

    ],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", "x-upload-domain", "x-app-id"],
    credentials: true,
  })
);

// Required for preflight
app.options("*", cors());

/* ---------------- LOGGING ---------------- */

app.use(morgan("combined"));

/* ---------------- PUBLIC ROUTES ---------------- */

// Health
app.get("/health", (_, res) => {
  res.json({ status: "OK" });
});

// Trust proxy (optional but recommended for correct IP logging)
app.set("trust proxy", true);

// Public friendly URL
app.get("/f/:domain/:filename", downloadController.downloadByFilename);

// Public canonical UUID URL
app.get(
  "/:identifier([0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[1-5][0-9a-fA-F-]{3}-[89abAB][0-9a-fA-F-]{3}-[0-9a-fA-F-]{12})",
  downloadController.downloadByUuid
);


// PUBLIC STATIC FILES (CRITICAL FIX)
app.use(
  "/uploads",
  express.static(process.env.UPLOAD_BASE || "/var/uploads", {
    maxAge: "365d",
    immutable: true,
  })
);

/* ---------------- PROTECTED ROUTES ---------------- */

app.use(domainMiddleware);
app.use(authMiddleware);

app.use("/api/upload", uploadRoutes);
app.use("/api/download", downloadRoutes);



// cron.schedule("0 0 * * *", async () => {
//   console.log("Running cleanup job...");
//   await cleanupService.cleanOldFiles();
// });

cron.schedule("*/5 * * * * *", async () => {
  console.log("🧹 Running cleanup job...");
  await cleanupService.cleanOldFiles();
});


/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3014;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Upload service running on ${PORT}`);
});

cron.schedule("0 0 * * *", async () => {
  console.log("Running cleanup job...");
  await cleanupService.cleanOldFiles();
});
