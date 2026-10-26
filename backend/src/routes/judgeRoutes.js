const express = require('express');
const router = express.Router();
const judgeController = require('../controllers/judgeController');

// GET /api/judges - List all judges
router.get('/', judgeController.getAllJudges);

// POST /api/judges - Create a new judge
router.post('/', judgeController.createJudge);

// POST /api/judges/login - Judge authentication via username & pin
router.post('/login', judgeController.loginJudge);

// GET /api/judges/:judgeId/matches - List all matches assigned to a judge
router.get('/:judgeId/matches', judgeController.getJudgeMatches);

// PUT /api/judges/:id - Update judge details / toggle is_active
router.put('/:id', judgeController.updateJudge);

// DELETE /api/judges/:id - Delete judge
router.delete('/:id', judgeController.deleteJudge);

module.exports = router;
