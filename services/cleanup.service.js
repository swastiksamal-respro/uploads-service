//services/cleanup.service.js

const fs = require("fs/promises");
const path = require("path");
const repo = require("../db/upload.repository");

/**
 * Permanently purges soft-deleted files that have been in the removed-files
 * quarantine folder for longer than `seconds` seconds.
 *
 * Steps per file:
 *  1. Delete the physical file from REMOVED_FILES_DIR
 *  2. Hard-delete the DB record (no recovery after this point)
 */
exports.cleanOldFiles = async () => {
  const gracePeriodSeconds = Number(process.env.CLEANUP_GRACE_SECONDS) || 3;
  const files = await repo.findDeletedOlderThanSeconds(gracePeriodSeconds);

  console.log(`[cleanup] Found ${files.length} file(s) eligible for permanent purge`);

  for (const file of files) {
    const removedBase = process.env.REMOVED_FILES_DIR;
    const filePath = path.join(removedBase, file.domain, file.stored_path);

    console.log(`[cleanup] Purging: ${filePath} (uuid=${file.uuid})`);

    // 1. Remove physical file from quarantine
    await fs.unlink(filePath).catch((err) => {
      console.warn(`[cleanup] Could not unlink ${filePath}: ${err.message}`);
    });

    // 2. Hard-delete DB record
    await repo.hardDelete(file.uuid).catch((err) => {
      console.error(`[cleanup] DB hard-delete failed for uuid=${file.uuid}: ${err.message}`);
    });
  }

  console.log(`[cleanup] Done. Purged ${files.length} file(s).`);
};
