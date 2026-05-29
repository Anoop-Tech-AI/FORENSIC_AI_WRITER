const express = require('express');
const router = express.Router();
const { createCase, getCases, getStats, deleteCase } = require('../controllers/caseController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');

// Case routes restricted to legal_advisor and investigator
router.route('/')
    .post(protect, checkRole(['legal_advisor', 'investigator']), createCase)
    .get(protect, checkRole(['legal_advisor', 'investigator']), getCases);

router.get('/stats', protect, checkRole(['legal_advisor', 'investigator']), getStats);

router.route('/:id')
    .delete(protect, checkRole(['legal_advisor', 'investigator']), deleteCase);

module.exports = router;
