const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../config/socket');

/**
 * @route   GET /api/cases/stats
 * @desc    Get dashboard stats
 */
router.get('/stats', protect, async (req, res) => {
    try {
        const totalCases = await Case.countDocuments();
        const activeCases = await Case.countDocuments({ status: 'analyzing' });
        const pendingCases = await Case.countDocuments({ status: 'pending' });
        const approvedCases = await Case.countDocuments({ status: 'approved' });

        res.json({
            success: true,
            totalCases,
            activeCases,
            pendingCases,
            approvedCases,
            // Mocking legacy fields for backward compatibility if needed
            stats: {
                totalCases,
                activeInvestigations: activeCases,
                pendingApproval: pendingCases
            }
        });
    } catch (error) {
        console.error('Fetch case stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

/**
 * @route   GET /api/cases
 * @desc    Get all cases
 */
router.get('/', protect, async (req, res) => {
    try {
        const cases = await Case.find().sort({ createdAt: -1 });
        res.json({ success: true, cases });
    } catch (error) {
        console.error('Fetch cases error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
});

/**
 * @route   GET /api/cases/:id
 * @desc    Get single case by ID or custom caseId
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const query = req.params.id.startsWith('FW-') 
            ? { caseId: req.params.id } 
            : { _id: req.params.id };
            
        const caseData = await Case.findOne(query).populate('createdBy', 'username name');
        
        if (!caseData) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }
        
        res.json({ success: true, case: caseData });
    } catch (error) {
        console.error('Fetch case error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch case' });
    }
});

/**
 * @route   POST /api/cases
 * @desc    Create new case (Sets status to pending)
 */
router.post('/', protect, checkRole(['admin', 'investigator']), async (req, res) => {
    try {
        const { caseName, caseId, investigatorName, notes } = req.body;
        
        if (!caseName || !caseId) {
            return res.status(400).json({ success: false, message: 'Case name and ID are required' });
        }
        
        const newCase = await Case.create({
            caseId,
            caseName,
            investigatorName: investigatorName || req.user.name || req.user.username,
            notes,
            status: 'pending',
            createdBy: req.user._id
        });

        // Notify Admin of new case pending approval
        const io = req.app.get('io');
        if (io) {
            // Find admins to notify
            const User = require('../models/User');
            const admins = await User.find({ role: 'admin' });
            
            for (const admin of admins) {
                const notification = {
                    userId: admin._id,
                    title: 'New Case Pending Approval',
                    message: `Investigator ${req.user.username} created case ${caseId}. Review required.`,
                    type: 'case',
                    senderId: req.user._id,
                    senderName: req.user.username,
                    senderRole: req.user.role,
                    link: `/admin/dashboard`
                };
                await Notification.create(notification);
                sendNotificationToUser(io, admin._id, notification);
            }
        }
        
        res.status(201).json({ success: true, case: newCase });
    } catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ success: false, message: 'Failed to create case' });
    }
});

/**
 * @route   POST /api/cases/:id/approve
 * @desc    Admin approves a case
 */
router.post('/:id/approve', protect, checkRole(['admin']), async (req, res) => {
    try {
        const caseData = await Case.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        );

        if (!caseData) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        // Notify Investigator
        const io = req.app.get('io');
        if (io) {
            const notification = {
                userId: caseData.createdBy,
                title: 'Case Approved',
                message: `Your case ${caseData.caseId} has been approved by admin.`,
                type: 'case',
                senderId: req.user._id,
                senderName: req.user.username,
                senderRole: req.user.role,
                link: `/cases/${caseData._id}`
            };
            await Notification.create(notification);
            sendNotificationToUser(io, caseData.createdBy, notification);
        }

        res.json({ success: true, case: caseData });
    } catch (error) {
        console.error('Approve case error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve case' });
    }
});

/**
 * @route   POST /api/cases/:id/reject
 * @desc    Admin rejects a case with remarks
 */
router.post('/:id/reject', protect, checkRole(['admin']), async (req, res) => {
    try {
        const { remarks } = req.body;
        const caseData = await Case.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected', remarks: remarks || 'No remarks provided' },
            { new: true }
        );

        if (!caseData) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        // Notify Investigator
        const io = req.app.get('io');
        if (io) {
            const notification = {
                userId: caseData.createdBy,
                title: 'Case Rejected',
                message: `Your case ${caseData.caseId} was rejected. Remarks: ${remarks}`,
                type: 'remark',
                senderId: req.user._id,
                senderName: req.user.username,
                senderRole: req.user.role,
                link: `/cases`
            };
            await Notification.create(notification);
            sendNotificationToUser(io, caseData.createdBy, notification);
        }

        res.json({ success: true, case: caseData });
    } catch (error) {
        console.error('Reject case error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject case' });
    }
});

module.exports = router;
