const express = require('express');
const router = express.Router();
const { saveReport, getReports, deleteReport, generateForensicReport, downloadReport, getReportAnalysis } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { requireForensicInvestigator } = require('../utils/rbac');

router.route('/')
    .post(protect, saveReport)
    .get(protect, getReports);

router.delete('/:id', protect, deleteReport);

// New forensic report routes - restricted to forensic investigators and admins
router.post('/generate', protect, requireForensicInvestigator, generateForensicReport);
router.get('/:id/download', protect, requireForensicInvestigator, downloadReport);
router.get('/:id/analysis', protect, requireForensicInvestigator, getReportAnalysis);

module.exports = router;
