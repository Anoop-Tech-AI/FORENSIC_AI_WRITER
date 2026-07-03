const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');

// Multer Config
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

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).array('evidence', 10); // Allow up to 10 files

// Helper to calculate SHA-256 hash
const getFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
};

// @desc    Upload evidence for a case
// @route   POST /api/evidence/:caseId
// @access  Private
const uploadEvidence = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(`[EVIDENCE] Upload error:`, err.message);
            return res.status(400).json({ message: 'Upload Failed', error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            console.error(`[EVIDENCE] No files received`);
            return res.status(400).json({ message: 'No files uploaded' });
        }

        try {
            const caseId = req.params.caseId;
            console.log(`\n[EVIDENCE] Starting upload for case: ${caseId}`);
            console.log(`[EVIDENCE] Files count: ${req.files.length}`);

            const forensicCase = await Case.findById(caseId);

            if (!forensicCase) {
                console.error(`[EVIDENCE] Case not found: ${caseId}`);
                return res.status(404).json({ message: 'Case not found' });
            }

            console.log(`[EVIDENCE] Case found: ${forensicCase.caseName}`);

            const evidenceDocs = [];

            for (const file of req.files) {
                console.log(`  [${file.originalname}] Starting hash calculation...`);
                const hash = await getFileHash(file.path);
                console.log(`  [${file.originalname}] Hash: ${hash}`);

                const newEvidence = await Evidence.create({
                    case: caseId,
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    fileUrl: `/uploads/${file.filename}`,
                    fileSize: file.size,
                    fileHash: hash,
                    uploadedBy: req.user._id
                });

                evidenceDocs.push(newEvidence._id);
                console.log(`  [${file.originalname}] Evidence doc created: ${newEvidence._id}`);
            }

            // Link evidence to case
            forensicCase.evidence.push(...evidenceDocs);
            await forensicCase.save();
            
            console.log(`[EVIDENCE] All ${evidenceDocs.length} files linked to case`);
            console.log(`[EVIDENCE] Case evidence count: ${forensicCase.evidence.length}`);
            console.log(`[EVIDENCE] Upload complete\n`);

            res.status(201).json({
                message: 'Evidence uploaded and hashed successfully',
                evidenceCount: evidenceDocs.length,
                totalEvidenceInCase: forensicCase.evidence.length
            });

        } catch (error) {
            console.error(`[EVIDENCE] Error:`, error.message);
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
    });
};

module.exports = { uploadEvidence };
