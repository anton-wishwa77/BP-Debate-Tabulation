const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// POST /api/admin/seed - Seed database with sample teams and judges
router.post('/seed', adminController.seedDatabase);

// POST /api/admin/reset - Reset database tables with CASCADE
router.post('/reset', adminController.resetDatabase);

module.exports = router;
