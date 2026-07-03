const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../config/socket');

// @desc    Respond to case assignment (accept/decline)
// @route   POST /api/case-assignments/respond
// @access  Private (legal_advisor, forensic_investigator)
const respondToCaseAssignment = async (req, res) => {
    try {
        const { caseId, action, reason } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Find the case
        const caseItem = await Case.findById(caseId);
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Check if user already responded
        const existingResponse = await CaseAssignment.findOne({
            caseId,
            userId,
            status: { $in: ['accepted', 'declined'] }
        });

        if (existingResponse) {
            return res.status(400).json({ message: 'Already responded to this case' });
        }

        // Create assignment response
        const assignmentResponse = await CaseAssignment.create({
            caseId,
            userId,
            role: userRole,
            action, // 'accepted' or 'declined'
            reason: reason || null,
            respondedAt: new Date()
        });

        // If accepted, assign case to user
        if (action === 'accepted') {
            await Case.findByIdAndUpdate(caseId, {
                $addToSet: { assignedTo: userId },
                $set: { status: 'assigned' }
            });

            // Notify case creator
            const caseCreatorNotification = {
                title: 'Case Assignment Accepted',
                message: `${req.user.username} (${userRole}) has accepted case ${caseItem.caseId}`,
                type: 'case',
                senderName: 'System',
                senderRole: 'system',
                relatedCaseId: caseId,
                createdAt: new Date()
            };

            await Notification.create({
                userId: caseItem.createdBy,
                ...caseCreatorNotification
            });

            sendNotificationToUser(req.app.get('io'), caseItem.createdBy, caseCreatorNotification);
        }

        // If declined, save reason and notify case creator
        if (action === 'declined') {
            await Case.findByIdAndUpdate(caseId, {
                $addToSet: { declinedBy: { userId, reason, role: userRole, declinedAt: new Date() } }
            });

            // Notify case creator about decline
            const declineNotification = {
                title: 'Case Assignment Declined',
                message: `${req.user.username} (${userRole}) declined case ${caseItem.caseId}. Reason: ${reason}`,
                type: 'case',
                senderName: 'System',
                senderRole: 'system',
                relatedCaseId: caseId,
                createdAt: new Date()
            };

            await Notification.create({
                userId: caseItem.createdBy,
                ...declineNotification
            });

            sendNotificationToUser(req.app.get('io'), caseItem.createdBy, declineNotification);
        }

        res.status(201).json({ 
            success: true, 
            message: `Case ${action} successfully`,
            assignment: assignmentResponse 
        });

    } catch (error) {
        console.error('Case assignment response error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get pending case assignments for user
// @route   GET /api/case-assignments
// @access  Private (legal_advisor, forensic_investigator)
const getCaseAssignments = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find cases assigned to this user that are pending response
        const assignments = await CaseAssignment.find({
            userId,
            status: 'pending'
        }).populate({
            path: 'caseId',
            select: 'caseId caseName date createdBy'
        });

        res.json({ 
            success: true, 
            assignments: assignments.map(a => ({
                id: a._id,
                case: a.caseId,
                assignedAt: a.createdAt,
                requiresResponse: true
            }))
        });

    } catch (error) {
        console.error('Get case assignments error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    respondToCaseAssignment,
    getCaseAssignments
};
