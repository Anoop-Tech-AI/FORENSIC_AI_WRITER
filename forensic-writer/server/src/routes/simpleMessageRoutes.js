const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationToUser } = require('../config/socket');

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get count of unread messages for current user
 */
router.get('/unread-count', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const unreadCount = await Message.countDocuments({
            receiverId: userId,
            isRead: false
        });
        res.json({ success: true, unreadCount });
    } catch (error) {
        console.error('Fetch unread count error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for current user
 */
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'username name role avatar')
        .sort({ lastMessageTime: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Fetch conversations error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/messages/:receiverId
 * @desc    Get messages between current user and target user
 */
router.get('/:receiverId', protect, async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 });

        // Mark incoming messages as read
        await Message.updateMany(
            { senderId: receiverId, receiverId: senderId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/messages/send
 * @desc    Send a message (Internal logic handles conversation creation)
 */
router.post('/send', protect, async (req, res) => {
    try {
        const { caseId, userId, message } = req.body;
        const senderId = req.user._id;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message text is required' });
        }

        let conv;
        if (caseId) {
            // Find or create case conversation
            conv = await Conversation.findOne({ caseId, type: 'case' });
            if (!conv) {
                // For case threads, ideally we add all relevant parties. 
                // For now, let's keep it simple: admin, legal, and the investigator.
                // In a real system, we'd find all users associated with this case.
                const systemUsers = await User.find({ role: { $in: ['admin', 'legal_advisor'] } });
                const participants = [...new Set([...systemUsers.map(u => u._id), senderId])];
                
                conv = await Conversation.create({
                    caseId,
                    type: 'case',
                    participants,
                    lastMessage: message,
                    lastMessageTime: new Date()
                });
            }
        } else if (userId) {
            // Find or create direct conversation
            conv = await Conversation.findOne({
                type: 'direct',
                participants: { $all: [senderId, userId] }
            });
            if (!conv) {
                conv = await Conversation.create({
                    type: 'direct',
                    participants: [senderId, userId],
                    lastMessage: message,
                    lastMessageTime: new Date()
                });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Context (Case or User) required' });
        }

        const newMessage = await Message.create({
            conversationId: conv._id,
            senderId,
            receiverId: userId || null, // null for case-wide messages
            message,
            isRead: false
        });

        // Update conversation preview
        await Conversation.findByIdAndUpdate(conv._id, {
            lastMessage: message,
            lastMessageTime: new Date()
        });

        // Real-time emission via Socket.io
        const io = req.app.get('io');
        if (io) {
            // Emit to the conversation room
            io.to(conv._id.toString()).emit('receiveMessage', {
                ...newMessage._doc,
                senderName: req.user.name || req.user.username,
                senderRole: req.user.role
            });

            // If direct message, send notification to receiver
            if (userId && conv.type === 'direct') {
                const notification = {
                    userId,
                    title: `New message from ${req.user.name || req.user.username}`,
                    message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                    type: 'message',
                    senderId,
                    senderName: req.user.name || req.user.username,
                    senderRole: req.user.role,
                    isPersonal: true
                };
                
                // Create notification in DB
                await Notification.create(notification);
                
                // Emit via socket
                sendNotificationToUser(io, userId, notification);
            }

            // For case messages, notify others in the case
            if (caseId && conv.type === 'case') {
                conv.participants.forEach(async (participantId) => {
                    if (participantId.toString() !== senderId.toString()) {
                        const notification = {
                            userId: participantId,
                            title: `New message in case ${caseId}`,
                            message: `${req.user.username}: ${message}`,
                            type: 'message',
                            senderId,
                            senderName: req.user.name || req.user.username,
                            senderRole: req.user.role,
                            isPersonal: false,
                            relatedCaseId: null // We could resolve this if needed
                        };
                        await Notification.create(notification);
                        sendNotificationToUser(io, participantId, notification);
                    }
                });
            }
        }

        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = { router };
