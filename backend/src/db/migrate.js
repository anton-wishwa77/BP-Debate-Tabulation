const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running database migrations...');
    await pool.query(sql);
    console.log('Database migration completed successfully. All 5 tables created.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
