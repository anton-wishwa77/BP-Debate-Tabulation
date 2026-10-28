const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// GET /api/matches/:matchId - View match and participants
router.get('/:matchId', matchController.getMatchById);

// PUT /api/matches/:matchId/ballot - Submit or update ballot
router.put('/:matchId/ballot', matchController.submitBallot);

// PATCH /api/matches/:id/adjudicator - Allocate, reassign or vacate judge
router.patch('/:id/adjudicator', matchController.reassignAdjudicator);
router.patch('/:matchId/adjudicator', matchController.reassignAdjudicator);

module.exports = router;
