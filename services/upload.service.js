//services/upload.service.js

const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");

const repo = require("../db/upload.repository");
const hash = require("./hash.service");
const generateUuid = require("../utils/uuid");

exports.handleUpload = async (req) => {
  //# if there is no file in req object
  if (!req.file) {
    const err = new Error("No file uploaded");
    err.statusCode = 400;
    throw err;
  }

  // #
  const { uploadPath, publicBase } = req.domainConfig || {};

  if (!uploadPath || !publicBase) {
    const err = new Error("Invalid domain configuration (uploadPath/publicBase missing)");
    err.statusCode = 400;
    throw err;
  }

  const uuid = generateUuid();

  await fs.mkdir(uploadPath, { recursive: true });

  const originalName = req.file.originalname;
  const ext = path.extname(originalName);
  const storedFileName = `${uuid}${ext}`;
  const relativePath = storedFileName;
  const finalPath = path.join(uploadPath, relativePath);

  await new Promise((resolve, reject) => {
    const read = fsSync.createReadStream(req.file.path);
    const write = fsSync.createWriteStream(finalPath);
    read.on("error", reject);
    write.on("error", reject);
    write.on("finish", resolve);
    read.pipe(write);
  });

  await fs.unlink(req.file.path);

  const sha256 = await hash.sha256(finalPath);

  await repo.insert({
    uuid,
    domain: req.uploadDomain,
    app_id: req.user?.app_id || null,
    user_id: req.user?.id || null,
    created_by: req.user?.id || null,
    original_name: originalName,
    stored_path: relativePath,
    mime_type: req.file.mimetype,
    size: req.file.size,
    url_uuid: uuid,
    url_filename: originalName,
    is_deleted:0
  });

  return {
    uuid,
    domain: req.uploadDomain,
    stored_path: relativePath,
    urls: {
      canonical: `${publicBase}/${uuid}`,
      api: `${publicBase}/api/download/${uuid}`,
      static: `${publicBase}/uploads/${req.uploadDomain}/${relativePath}`,
      friendly: `${publicBase}/f/${req.uploadDomain}/${encodeURIComponent(originalName)}`
    },
    sha256,
    size: req.file.size,
    mime_type: req.file.mimetype,
    original_name: originalName
  };
};


exports.handleUpdate = async (req) => {
  const { uuid } = req.params;

  // Use include-deleted variant so we can give a proper error if soft-deleted
  const record = await repo.findByUuidIncludeDeleted(uuid);
  if (!record) {
    const err = new Error("File not found");
    err.statusCode = 404;
    throw err;
  }

  if (record.is_deleted === 1) {
    const err = new Error("Cannot update a deleted file");
    err.statusCode = 410;
    throw err;
  }

  const { uploadPath } = req.domainConfig || {};
    if (!uploadPath) {
      const err = new Error("Invalid domain config");
      err.statusCode = 400;
      throw err;
    }
    
  const oldPath = path.join(uploadPath, record.stored_path);

  let updatedFields = {
    last_modified_by: req.user?.id || null,
    last_modified_at: new Date()
  };

  // CASE 1: Replace file
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const newStoredPath = `${uuid}${ext}`;
    const finalPath = path.join(uploadPath, newStoredPath);

    await fs.unlink(oldPath).catch(() => {});

    await new Promise((resolve, reject) => {
      const read = fsSync.createReadStream(req.file.path);
      const write = fsSync.createWriteStream(finalPath);
      read.on("error", reject);
      write.on("error", reject);
      write.on("finish", resolve);
      read.pipe(write);
    });

    await fs.unlink(req.file.path);

    updatedFields = {
      ...updatedFields,
      stored_path: newStoredPath,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      last_modified_at: new Date()
    };
  }

  // CASE 2: Metadata-only update
  if (req.body.original_name) {
    updatedFields.original_name = req.body.original_name;
  }

  await repo.update(uuid, updatedFields);

  return { uuid, updated: true };
};


exports.handleDelete = async (req) => {
  const { uuid } = req.params;

  const record = await repo.findByUuidIncludeDeleted(uuid);
  
  if (!record) {
    const err = new Error("File not found");
    err.statusCode = 404;
    throw err;
  }

  if (record.is_deleted === 1) {
    const err = new Error("File already deleted");
    err.statusCode = 410;
    throw err;
  }

  const { uploadPath } = req.domainConfig;
  const filePath = path.join(uploadPath, record.stored_path);

  const removedBase = process.env.REMOVED_FILES_DIR;
  const removedDir = path.join(removedBase, record.domain);

  await fs.mkdir(removedDir, { recursive: true });

  const removedPath = path.join(removedDir, record.stored_path);

  // Move file to quarantine folder instead of permanent deletion
  // try {
  //   await fs.rename(filePath, removedPath);
  // } catch (err) {
  //   console.error("File move failed:", err.message);
  //   // optional: decide if you want to block delete or not
  // }

  // Soft-delete the DB record
  await repo.softDelete(uuid, req.user?.id || null);
};


exports.handleRestore = async (req) => {
  const { uuid } = req.params;

  const record = await repo.findByUuidIncludeDeleted(uuid);
  if (!record) {
    const err = new Error("File not found");
    err.statusCode = 404;
    throw err;
  }

  if (record.is_deleted === 0) {
    const err = new Error("File is not deleted");
    err.statusCode = 400;
    throw err;
  }

  const removedBase = process.env.REMOVED_FILES_DIR;
  const removedPath = path.join(removedBase, record.domain, record.stored_path);

  const { uploadPath } = req.domainConfig;
  const restoredPath = path.join(uploadPath, record.stored_path);

  // Move file back from quarantine folder
  await fs.mkdir(uploadPath, { recursive: true });
  await fs.rename(removedPath, restoredPath);

  await repo.restore(uuid);

  return { uuid, restored: true };
};
