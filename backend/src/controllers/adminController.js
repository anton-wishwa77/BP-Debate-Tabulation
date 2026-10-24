const seed = require('../db/seed');
const reset = require('../db/reset');

// POST /api/admin/seed
// Invoke seeding logic to populate 8 sample teams and 3 judges
async function seedDatabase(req, res, next) {
  try {
    const result = await seed({ closePool: false });
    return res.status(200).json({
      message: 'Database seeded successfully',
      teams: result.teams,
      judges: result.judges
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/admin/reset
// Invoke reset logic to truncate all 5 tables with RESTART IDENTITY CASCADE
async function resetDatabase(req, res, next) {
  try {
    const result = await reset({ closePool: false });
    return res.status(200).json({
      message: result.message
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  seedDatabase,
  resetDatabase
};
