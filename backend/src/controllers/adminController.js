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

// POST /api/admin/login
// Master admin credential verification
async function loginAdmin(req, res, next) {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    if (username === adminUser && password === adminPass) {
      return res.status(200).json({ success: true, username: adminUser });
    }
    return res.status(401).json({ error: 'Invalid Senate administrator credentials' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  seedDatabase,
  resetDatabase,
  loginAdmin
};
