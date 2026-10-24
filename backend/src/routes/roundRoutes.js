const express = require('express');
const router = express.Router();
const roundController = require('../controllers/roundController');

// GET /api/rounds - Fetch all rounds with nested matches and participants
router.get('/', roundController.getAllRounds);

// POST /api/rounds/generate - Atomic round generation (Round 1 Random or Round 2+ Swiss)
router.post('/generate', roundController.generateRound);

// PATCH /api/rounds/:id - Update motion text, info slide, or status
router.patch('/:id', roundController.updateRound);

// DELETE /api/rounds/:id - Delete a round and cascade delete matches/participants
router.delete('/:id', roundController.deleteRound);

module.exports = router;
