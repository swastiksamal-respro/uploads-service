// //db/download_log.repository.js
// const db = require("./index");

// exports.insert = async (log) => {
//   const statusStr = String(log.status);

//   await db.execute(
//     `
//     INSERT INTO download_logs
//     (upload_id, domain, identifier, ip_address, user_agent, status)
//     VALUES (?, ?, ?, ?, ?, ?)
//     `,
//     [
//       log.upload_id,
//       log.domain,
//       log.identifier,
//       log.ip,
//       log.user_agent,
//       statusStr
//     ]
//   );
// };


const db = require("./index");

exports.insert = async ({
  upload_id,
  domain,
  app_id,
  identifier,
  ip,
  user_agent,
  status
}) => {
  const sql = `
    INSERT INTO download_logs
    (upload_id, domain, app_id, identifier, ip_address, user_agent, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await db.execute(sql, [
    upload_id,
    domain,
    app_id,
    identifier,
    ip,
    user_agent,
    status
  ]);
};

