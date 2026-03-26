//middleware/domain.js
const domains = require("../config/domains");

module.exports = (req, res, next) => {
  // 🔹 Allow health
  if (req.path === "/health") return next();

  // 🔹 Allow download (no header required)
  if (req.method === "GET" && req.path !== "/upload") {
    return next();
  }

  const domain = req.headers["x-upload-domain"];
  if (!domain || !domains[domain]) {
    return res.status(400).json({ message: "Invalid or missing X-Upload-Domain" });
  }

  req.uploadDomain = domain;
  req.domainConfig = domains[domain];

  next();
};
