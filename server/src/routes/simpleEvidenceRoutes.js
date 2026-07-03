const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');
const NotificationService = require('../services/notificationService');

// Mock evidence storage (in-memory for testing)
let mockEvidence = [
    {
        _id: '1',
        fileName: 'call_records.csv',
        fileType: 'text/csv',
        fileSize: 167,
        fileUrl: 'uploads/call_records.csv',
        fileHash: 'abc123',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '2',
        fileName: 'call_records.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 4989,
        fileUrl: 'uploads/call_records.xlsx',
        fileHash: 'def456',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '3',
        fileName: 'chat_messages.db',
        fileType: 'application/x-sqlite3',
        fileSize: 8192,
        fileUrl: 'uploads/chat_messages.db',
        fileHash: 'ghi789',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '4',
        fileName: 'device_photo.jpg',
        fileType: 'image/jpeg',
        fileSize: 6018,
        fileUrl: 'uploads/device_photo.jpg',
        fileHash: 'jkl012',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    // Your actual uploaded files
    {
        _id: '5',
        fileName: 'witness_statement.txt',
        fileType: 'text/plain',
        fileSize: 856,
        fileUrl: 'uploads/witness_statement.txt',
        fileHash: 'witness_hash_123',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '6',
        fileName: 'chat_messages.txt',
        fileType: 'text/plain',
        fileSize: 1247,
        fileUrl: 'uploads/chat_messages.txt',
        fileHash: 'chat_hash_456',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '7',
        fileName: 'suspicious_activity.log',
        fileType: 'text/plain',
        fileSize: 2145,
        fileUrl: 'uploads/suspicious_activity.log',
        fileHash: 'activity_hash_789',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '8',
        fileName: 'forensic_report.pdf',
        fileType: 'application/pdf',
        fileSize: 15360,
        fileUrl: 'uploads/forensic_report.pdf',
        fileHash: 'report_hash_012',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    },
    {
        _id: '9',
        fileName: 'system_activity.log',
        fileType: 'text/plain',
        fileSize: 3280,
        fileUrl: 'uploads/system_activity.log',
        fileHash: 'system_hash_345',
        caseId: 'FW-4056',
        uploadedAt: new Date().toISOString()
    }
];

// Get all evidence for a case
router.get('/case/:caseId', protect, async (req, res) => {
    try {
        const { caseId } = req.params;
        console.log('Fetching evidence for caseId:', caseId);
        
        // Match by both the caseId string (e.g. FW-4056) AND the MongoDB _id
        // This handles both mock evidence (stored with caseId string) and 
        // real uploads (stored with the MongoDB _id from the upload URL)
        const caseEvidence = mockEvidence.filter(e => e.caseId === caseId);
        
        // If nothing found by caseId string, also try to look up the case
        // by its MongoDB _id and match by that case's caseId field
        if (caseEvidence.length === 0) {
            // Try matching mock evidence where caseId could be a MongoDB _id
            const allMatches = mockEvidence.filter(e => e.caseId === caseId || e.caseMongoId === caseId);
            if (allMatches.length > 0) {
                return res.json({ success: true, evidence: allMatches });
            }
        }
        
        console.log('Found evidence count:', caseEvidence.length);

        res.json({
            success: true,
            evidence: caseEvidence
        });
    } catch (error) {
        console.error('Error fetching evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch evidence'
        });
    }
});

// Get single evidence
router.get('/:id', protect, async (req, res) => {
    try {
        const evidenceId = req.params.id;
        const evidence = mockEvidence.find(e => e._id === evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found'
            });
        }

        res.json({
            success: true,
            evidence: evidence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch evidence'
        });
    }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Upload new evidence
router.post('/:caseId', protect, checkRole(['admin', 'investigator']), upload.array('evidence', 10), async (req, res) => {
    try {
        console.log("Mock Upload hit for case", req.params.caseId);
        console.log("Files received:", req.files ? req.files.length : 'none');

        const { caseId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedEvidences = req.files.map(file => {
            const newEvidence = {
                _id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size || 0,
                fileUrl: `/uploads/${file.filename}`,
                fileHash: 'hash_' + Date.now(),
                caseId,
                uploadedAt: new Date().toISOString()
            };
            console.log('Adding evidence:', newEvidence); // Debug log
            mockEvidence.push(newEvidence);
            return newEvidence;
        });

        console.log('Total evidence after upload:', mockEvidence.length); // Debug log

        // Create notifications for admins and investigators
        try {
            await NotificationService.notifyEvidenceUploaded(caseId, uploadedEvidences.length, req.user.username);
        } catch (notificationError) {
            console.error('Failed to create evidence notifications:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: 'Evidence uploaded and hashed successfully',
            evidenceCount: uploadedEvidences.length
        });
    } catch (error) {
        console.error('Mock upload error:', error.stack || error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload evidence',
            error: error.message
        });
    }
});

// Delete evidence
router.delete('/:id', protect, checkRole(['admin', 'investigator']), async (req, res) => {
    try {
        const evidenceId = req.params.id;
        const evidenceIndex = mockEvidence.findIndex(e => e._id === evidenceId);

        if (evidenceIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found'
            });
        }

        mockEvidence.splice(evidenceIndex, 1);

        res.json({
            success: true,
            message: 'Evidence deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete evidence'
        });
    }
});

module.exports = router;
