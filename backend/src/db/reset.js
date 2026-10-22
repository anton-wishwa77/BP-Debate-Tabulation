const { pool } = require('./index');

async function reset() {
  try {
    console.log('Resetting database tables...');
    await pool.query('TRUNCATE TABLE teams, judges, rounds, matches, match_participants RESTART IDENTITY CASCADE;');
    console.log('Database reset completed successfully. All 5 tables truncated.');
  } catch (err) {
    console.error('Database reset failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  reset();
}

module.exports = reset;
