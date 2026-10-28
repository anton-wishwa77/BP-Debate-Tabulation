const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const roundController = require('../controllers/roundController');

// POST /api/admin/seed - Seed database with sample teams and judges
router.post('/seed', adminController.seedDatabase);

// POST /api/admin/reset - Reset database tables with CASCADE
router.post('/reset', adminController.resetDatabase);

// POST /api/admin/login - Master admin authentication
router.post('/login', adminController.loginAdmin);

// GET /api/admin/rounds - Admin endpoint returning full draft room matrices
router.get('/rounds', roundController.getAllRoundsAdmin);

module.exports = router;
