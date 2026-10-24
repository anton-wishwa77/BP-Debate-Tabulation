const express = require('express');
const router = express.Router();
const judgeController = require('../controllers/judgeController');

// GET /api/judges - List all judges
router.get('/', judgeController.getAllJudges);

// POST /api/judges - Create a new judge
router.post('/', judgeController.createJudge);

// PUT /api/judges/:id - Update judge details / toggle is_active
router.put('/:id', judgeController.updateJudge);

// DELETE /api/judges/:id - Delete judge
router.delete('/:id', judgeController.deleteJudge);

module.exports = router;
