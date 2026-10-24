const { pool } = require('./index');

async function reset({ closePool = false } = {}) {
  try {
    console.log('Resetting database tables...');
    await pool.query('TRUNCATE TABLE teams, judges, rounds, matches, match_participants RESTART IDENTITY CASCADE;');
    console.log('Database reset completed successfully. All 5 tables truncated.');
    return { message: 'Database reset completed successfully. All 5 tables truncated.' };
  } catch (err) {
    console.error('Database reset failed:', err);
    if (closePool) {
      process.exitCode = 1;
    }
    throw err;
  } finally {
    if (closePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  reset({ closePool: true }).catch(() => process.exit(1));
}

module.exports = reset;

