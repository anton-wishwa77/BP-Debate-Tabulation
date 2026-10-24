const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// GET /api/teams - Query all teams
router.get('/', teamController.getAllTeams);

// POST /api/teams - Create a new team
router.post('/', teamController.createTeam);

// POST /api/teams/swing - Rule of 4 Swing Balancer
router.post('/swing', teamController.addSwingTeams);

// PUT /api/teams/:id - Update team details
router.put('/:id', teamController.updateTeam);

// DELETE /api/teams/:id - Delete team
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
