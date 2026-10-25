const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// GET /api/matches/:matchId - View match and participants
router.get('/:matchId', matchController.getMatchById);

// PUT /api/matches/:matchId/ballot - Submit or update ballot
router.put('/:matchId/ballot', matchController.submitBallot);

module.exports = router;
