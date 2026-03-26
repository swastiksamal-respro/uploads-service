//config/domains.js
const path = require("path");

const UPLOAD_BASE = process.env.UPLOAD_BASE || "/var/uploads";
const PUBLIC_BASE = process.env.PUBLIC_BASE || "http://localhost:3000";

module.exports = {
  "dev.reseapro.com": {
    uploadPath: path.join(UPLOAD_BASE, "dev.reseapro.com"),
    publicBase: PUBLIC_BASE
  },
  "dev.reseaprojournals.com": {
    uploadPath: path.join(UPLOAD_BASE, "dev.reseaprojournals.com"),
    publicBase: PUBLIC_BASE
  },
  "dev.manuscriptedit.com": {
    uploadPath: path.join(UPLOAD_BASE, "dev.manuscriptedit.com"),
    publicBase: PUBLIC_BASE
  },
  "dev.pubmanu.com": {
    uploadPath: path.join(UPLOAD_BASE, "dev.pubmanu.com"),
    publicBase: PUBLIC_BASE
  },
  
};
