const knex = require('knex');
require('dotenv').config();

// source DB
const sourceDB = knex({
  client: 'mysql2',
  connection: {
    host: '198.38.86.28',
    user: 'dev_db_r1_reseapro',
    password: 'MEkh8UAh-GodJkgY',
    database: 'dev_db_r1_central_upload_system'
  }
});

// target DB
const targetDB = knex({
  client: 'mysql2',
  connection: {
    host: '198.38.86.28',
    user: 'tst_db_r1_reseapro',
    password: 'eaMKHtpI6H/9nT;a',
    database: 'tst_db_r1_central_upload_system'
  }
});

console.log("Connected DB:", targetDB.client.config.connection.database);
console.log("Host:", targetDB.client.config.connection.host);

async function ensureTableExists(tableName) {
  const exists = await targetDB.schema.hasTable(tableName);

  if (!exists) {
    console.log(`Creating table: ${tableName}`);

    // get exact CREATE TABLE query from source
    const [result] = await sourceDB.raw(`SHOW CREATE TABLE ${tableName} `);
    const createSQL = result[0]['Create Table'];

    // run same query on target
    await targetDB.raw(createSQL);

    console.log(`✅ Table ${tableName} created with full schema`);
  }
}

async function migrateTable(tableName) {
  const chunkSize = 100;
  let offset = 0;

  //& Adding missing columns
  const sourceColumns = await sourceDB(tableName).columnInfo();
  const targetColumns = await targetDB(tableName).columnInfo();

  const missingColumns = Object.keys(sourceColumns).filter(
    col => !targetColumns[col]
  );

  for (const col of missingColumns) {
    const colType = sourceColumns[col].type;

    console.log(`Adding column ${col} (${colType})`);

    await targetDB.schema.alterTable(tableName, table => {
      // basic type mapping
      if (colType.includes('int')) table.integer(col);
      else if (colType.includes('varchar')) table.string(col);
      else if (colType.includes('text')) table.text(col);
      else if (colType.includes('timestamp')) table.timestamp(col);
      else table.string(col); // fallback
    });
  }

  while (true) {
    const rows = await sourceDB(tableName)
      .select('*')
      .limit(chunkSize)
      .offset(offset);

    if (rows.length === 0) break;

    // optional: remove id to avoid conflicts
    // const cleaned = rows.map(({ id, ...rest }) => rest);

    // await targetDB(tableName).insert(cleaned);


    //#Dynamically allotting primary key.
    const [pk] = await sourceDB.raw(`SHOW KEYS FROM ${tableName} WHERE Key_name = 'PRIMARY'`);
    const primaryKey = pk[0].Column_name;

    await targetDB(tableName)
    .insert(rows)
    .onConflict(primaryKey) //!need to put the primary key here.
    .merge();

    console.log(`[${tableName}] Migrated ${offset + rows.length}`);

    offset += chunkSize;
  }
}

async function runMigration() {
  try {
    const tables = ['demo']; // add more tables if needed

    for (const table of tables) {
      console.log(`Migrating table: ${table}`);

      await ensureTableExists(table);
      await migrateTable(table);
    }

    console.log('✅ Migration complete!');

    const result = await targetDB.raw("SHOW TABLES");
    console.log("Tables in DB:", result);
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sourceDB.destroy();
    await targetDB.destroy();
    process.exit();
  }
  
}

runMigration();



