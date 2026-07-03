const express = require('express');
const router = express.Router();

let mockComments = [];

router.get('/:caseId', async (req, res) => {
    try {
        const caseId = req.params.caseId;
        const caseComments = mockComments.filter(c => c.caseId === caseId);
        res.json(caseComments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
});

router.post('/:caseId', async (req, res) => {
    try {
        const { message } = req.body;
        const caseId = req.params.caseId;
        
        // Mock user from token parsed by simple auth middleware
        const sender = {
            _id: Date.now().toString(),
            name: 'Test Legal Adviser',
            role: 'legal_adviser'
        };

        const newComment = {
            _id: Date.now().toString(),
            caseId,
            senderRole: sender.role,
            senderId: sender._id,
            senderName: sender.name,
            message,
            timestamp: new Date().toISOString()
        };

        mockComments.push(newComment);

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
});

module.exports = router;
