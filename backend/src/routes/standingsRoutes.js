const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standingsController');

// GET /api/standings/teams - Dynamic team standings
router.get('/teams', standingsController.getTeamStandings);

// GET /api/standings/speakers - Dynamic individual speaker leaderboard
router.get('/speakers', standingsController.getSpeakerStandings);

module.exports = router;
