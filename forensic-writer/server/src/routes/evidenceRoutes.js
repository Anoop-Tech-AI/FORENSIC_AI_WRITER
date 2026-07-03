const express = require('express');
const router = express.Router();
const { uploadEvidence } = require('../controllers/evidenceController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');
const { setEvidenceStore } = require('../controllers/aiController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// In-memory storage for evidence (temporary solution)
let evidenceStore = [];

// Share the evidence store with AI controller
setEvidenceStore(evidenceStore);

// GET evidence by case ID
router.get('/case/:caseId', protect, async (req, res) => {
    try {
        const { caseId } = req.params;
        console.log('[EVIDENCE] Fetching for case:', caseId);
        
        const evidence = evidenceStore.filter(e => e.caseId === caseId);
        console.log('[EVIDENCE] Found:', evidence.length, 'files');
        
        res.json(evidence);
    } catch (err) {
        console.error('[EVIDENCE] Error:', err);
        res.status(500).json({ message: 'Error fetching evidence' });
    }
});

// Upload evidence to a case (investigator only)
router.post('/:caseId', protect, checkRole(['investigator']), upload.array('evidence', 10), async (req, res) => {
    try {
        const { caseId } = req.params;
        console.log('[UPLOAD] Uploading to case:', caseId);
        console.log('[UPLOAD] Files received:', req.files ? req.files.length : 0);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedEvidence = req.files.map(file => {
            const newEvidence = {
                _id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size || 0,
                fileUrl: `/uploads/${file.filename}`,
                filePath: file.path, // Add actual file path for content extraction
                caseId: caseId,
                uploadedAt: new Date().toISOString()
            };
            evidenceStore.push(newEvidence);
            return newEvidence;
        });

        console.log('[UPLOAD] Successfully uploaded:', uploadedEvidence.length, 'files');
        console.log('[UPLOAD] Total evidence in store:', evidenceStore.length);
        
        res.status(201).json({
            success: true,
            message: 'Evidence uploaded successfully',
            evidence: uploadedEvidence,
            evidenceCount: uploadedEvidence.length
        });
    } catch (err) {
        console.error('[UPLOAD] Error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

module.exports = router;
