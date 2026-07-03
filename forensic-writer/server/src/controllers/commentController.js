const CaseComment = require('../models/CaseComment');
const Notification = require('../models/Notification');
const Case = require('../models/Case');
const User = require('../models/User');

// @desc    Get all comments for a case
// @route   GET /api/comments/:caseId
// @access  Private
const getComments = async (req, res) => {
    try {
        const comments = await CaseComment.find({ caseId: req.params.caseId })
            .sort('timestamp')
            .populate('senderId', 'name username avatar');
            
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a comment/remark to a case
// @route   POST /api/comments/:caseId
// @access  Private (Admin, Legal Adviser, Investigator)
const addComment = async (req, res) => {
    try {
        const { message } = req.body;
        const caseId = req.params.caseId;
        const sender = req.user;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const comment = new CaseComment({
            caseId,
            senderRole: sender.role,
            senderId: sender._id,
            senderName: sender.name || sender.username,
            message
        });

        await comment.save();

        // Populate sender info for the response
        await comment.populate('senderId', 'name username avatar');

        // Create notification logic based on sender
        // If Legal Adviser/Admin sends, notify Investigator
        // If Investigator sends, notify Legal Advisers and Admins
        let usersToNotify = [];
        
        if (sender.role === 'admin' || sender.role === 'legal_adviser') {
            usersToNotify.push(caseData.createdBy); // The investigator who made the case
        } else if (sender.role === 'investigator') {
            // Find all admins and legal advisers
            const oversightUsers = await User.find({ role: { $in: ['admin', 'legal_adviser'] } });
            usersToNotify = oversightUsers.map(u => u._id);
        }

        // Create notifications
        const notificationPromises = usersToNotify.map(userId => {
            // Don't notify the sender themselves
            if (userId.toString() === sender._id.toString()) return null;
            
            return new Notification({
                userId,
                title: 'New Case Remark',
                message: `${sender.name || sender.username} (${sender.role}) added a remark to case ${caseData.caseId}.`,
                type: 'remark',
                relatedCaseId: caseId
            }).save();
        });

        await Promise.all(notificationPromises.filter(p => p !== null));

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getComments,
    addComment
};
