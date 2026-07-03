const express = require('express');
const router = express.Router();
const { createCase, getCases, getStats, deleteCase, getCaseById, approveCase, rejectCase } = require('../controllers/caseController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');

// Stats - available to all authenticated roles
router.get('/stats', protect, checkRole(['admin', 'legal_advisor', 'investigator']), getStats);

// Case listing & creation
router.route('/')
    .post(protect, checkRole(['investigator']), createCase)
    .get(protect, checkRole(['admin', 'legal_advisor', 'investigator']), getCases);

// Single case operations
router.route('/:id')
    .get(protect, checkRole(['admin', 'legal_advisor', 'investigator']), getCaseById)
    .delete(protect, checkRole(['admin', 'investigator']), deleteCase);

// Admin case approval workflow
router.post('/:id/approve', protect, checkRole(['admin']), approveCase);
router.post('/:id/reject', protect, checkRole(['admin']), rejectCase);

module.exports = router;
