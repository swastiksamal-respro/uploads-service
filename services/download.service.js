//services/download.service.js
const path = require("path");
const fs = require("fs");

const repo = require("../db/upload.repository");
const downloadLogRepo = require("../db/download_log.repository");

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}



function isUuid(identifier) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    identifier
  );
}



function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "";
}



async function logDownload({ upload_id, domain, identifier, req, status }) {
  try {
   await downloadLogRepo.insert({
  upload_id: upload_id || null,
  domain: domain || null,
  app_id: req.headers["x-app-id"] || null,  // ✅ APP LOGGING
  identifier,
  ip: getClientIp(req),
  user_agent: req.headers["user-agent"] || "",
  status
});
  } catch (e) {
    console.error("DOWNLOAD LOG ERROR:", e.message);
  }
}



async function sendFile({ req, res, file, identifier }) {
  const UPLOAD_BASE = process.env.UPLOAD_BASE || "/var/uploads";
  const uploadPath = path.join(UPLOAD_BASE, file.domain);
  const absolutePath = path.join(uploadPath, file.stored_path);

  if (!fs.existsSync(absolutePath)) {
    await logDownload({
      upload_id: file.id || null,
      domain: file.domain,
      identifier,
      req,
      status: 404
    });

    console.log("SEND FILE absolutePath:", absolutePath);
    console.log("SEND FILE isAbsolute:", path.isAbsolute(absolutePath));
    console.log("SEND FILE exists:", fs.existsSync(absolutePath));

    return res.status(404).json({ message: "File missing on disk" });
  }

  await logDownload({
    upload_id: file.id || null,
    domain: file.domain,
    identifier,
    req,
    status: 200
  });

  res.setHeader("Content-Disposition", `inline; filename="${file.original_name}"`);
  return res.sendFile(path.resolve(absolutePath));
}



exports.handleDownloadByUuid = async (req, res) => {
  const identifier = safeDecode(req.params.identifier || "");

  if (!isUuid(identifier)) {
    await logDownload({ upload_id: null, domain: null, identifier, req, status: 400 });
    return res.status(400).json({ message: "Invalid identifier (UUID required)" });
  }

  const file = await repo.findByUuidIncludeDeleted(identifier);
  
  if (!file) {
    await logDownload({ upload_id: null, domain: null, identifier, req, status: 404 });
    return res.status(404).json({ message: "File not found" });
  }

   if (file.is_deleted === 1) {
    await logDownload({
      upload_id: file.id || null,
      domain: file.domain,
      identifier,
      req,
      status: 410
    });

    return res.status(410).json({ message: "File has been deleted" });
  }

  return sendFile({ req, res, file, identifier });
};



exports.handleDownloadByFilename = async (req, res) => {
  const domain = safeDecode(req.params.domain || "");
  const filename = safeDecode(req.params.filename || "");

  const identifier = `${domain}/${filename}`;

  if (!domain || !filename) {
    await logDownload({ upload_id: null, domain, identifier, req, status: 400 });
    return res.status(400).json({ message: "Invalid domain or filename" });
  }

  const file = await repo.findLatestByDomainAndOriginalNameIncludeDeleted(domain, filename);

  if (!file) {
    await logDownload({ upload_id: null, domain, identifier, req, status: 404 });
    return res.status(404).json({ message: "File not found" });
  }

  if (file.domain !== domain) {
    await logDownload({ upload_id: file.id || null, domain, identifier, req, status: 403 });
    return res.status(403).json({ message: "Forbidden" });
  }

  if (file.is_deleted === 1) {
    await logDownload({
      upload_id: file.id || null,
      domain: file.domain,
      identifier,
      req,
      status: 410
    });

    return res.status(410).json({ message: "File has been deleted" });
  }


  return sendFile({ req, res, file, identifier });
};

