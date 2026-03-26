// &

const db = require("./index");

/**
 * Insert upload record
 */
exports.insert = async (u) => {
  const sql = `
    INSERT INTO uploads
    (
      uuid,
      domain,
      app_id,
      user_id,
      created_by,
      original_name,
      stored_path,
      mime_type,
      size,
      url_uuid,
      url_filename,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.execute(sql, [
      u.uuid,
      u.domain,
      u.app_id,
      u.user_id,
      u.created_by,
      u.original_name,
      u.stored_path,
      u.mime_type,
      u.size,
      u.url_uuid,
      u.url_filename,
      u.status ?? 1
    ]);
  } catch (err) {
    console.error("UPLOAD DB ERROR ↓↓↓");
    console.error(err);
    console.error("UPLOAD DB ERROR ↑↑↑");
    throw err;
  }
};

/**
 * Find ACTIVE file by UUID
 */
exports.findByUuid = async (uuid) => {
  const [rows] = await db.execute(
    `SELECT * FROM uploads 
     WHERE uuid = ? AND status = 1 
     LIMIT 1`,
    [uuid]
  );
  return rows[0] || null;
};

/**
 * Find file by UUID INCLUDING deleted ones
 */
exports.findByUuidIncludeDeleted = async (uuid) => {
  const [rows] = await db.execute(
    `SELECT * FROM uploads 
     WHERE uuid = ? 
     LIMIT 1`,
    [uuid]
  );
  return rows[0] || null;
};

/**
 * Find latest active file by filename
 */
exports.findByFilename = async (filename) => {
  const [rows] = await db.execute(
    `
    SELECT * FROM uploads
    WHERE original_name = ?
      AND status = 1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [filename]
  );
  return rows[0] || null;
};

/**
 * Find latest active file by domain + filename
 */
exports.findLatestByDomainAndOriginalNameIncludeDeleted = async (domain, originalName) => {
  const [rows] = await db.execute(
    `
    SELECT * FROM uploads
    WHERE domain = ?
      AND original_name = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [domain, originalName]
  );
  return rows[0] || null;
};

/**
 * Dynamic update
 */
exports.update = async (uuid, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;

  const sql = `
    UPDATE uploads
    SET ${keys.map(k => `${k}=?`).join(", ")}
    WHERE uuid=?
  `;

  await db.query(sql, [...Object.values(fields), uuid]);
};

/**
 * Soft delete
 */
exports.softDelete = async (uuid, deletedBy = null) => {
  await db.query(
    `
    UPDATE uploads
    SET is_deleted = 1,
        deleted_at = NOW(),
        deleted_by = ?
    WHERE uuid = ?
    `,
    [deletedBy, uuid]
  );
};

/**
 * Restore soft-deleted file
 */
exports.restore = async (uuid) => {
  await db.query(
    `
    UPDATE uploads
    SET is_deleted = 0,
        deleted_at = NULL,
        deleted_by = NULL
    WHERE uuid = ?
    `,
    [uuid]
  );
};

/**
 * Hard delete (DB only)
 */
exports.hardDelete = async (uuid) => {
  await db.query(
    `DELETE FROM uploads WHERE uuid = ?`,
    [uuid]
  );
};

/**
 * Get old soft-deleted files (for cleanup job)
 */
exports.findDeletedOlderThanSeconds = async (seconds) => {
  const [rows] = await db.execute(
    `
    SELECT *
    FROM uploads
    WHERE status = 0
      AND deleted_at IS NOT NULL
      AND deleted_at <= NOW() - INTERVAL ? SECOND
    `,
    [seconds]
  );
  return rows;
};