const Notification = require('../models/Notification');
const User = require('../models/User');
const { 
    sendNotificationToUser, 
    sendNotificationToRole, 
    sendNotificationToAll,
    updateUnreadCount 
} = require('../config/socket');

/**
 * GET /api/notifications - Get all notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const skip = (page - 1) * limit;

        let query = { userId: req.user._id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate('relatedCaseId', 'caseId caseName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
        });

        res.json({
            notifications,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/notifications - Create a new notification
 */
const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, relatedCaseId } = req.body;

        // Validate required fields
        if (!userId || !title || !message || !type) {
            return res.status(400).json({ 
                message: 'userId, title, message, and type are required' 
            });
        }

        // Validate type
        if (!['case', 'evidence', 'report', 'system', 'remark'].includes(type)) {
            return res.status(400).json({ 
                message: 'Invalid type. Must be: case, evidence, report, remark, or system' 
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If relatedCaseId is provided, validate it exists
        if (relatedCaseId) {
            const Case = require('../models/Case');
            const caseExists = await Case.findById(relatedCaseId);
            if (!caseExists) {
                return res.status(404).json({ message: 'Related case not found' });
            }
        }

        const notification = new Notification({
            userId,
            title,
            message,
            type,
            senderId: req.user?._id || null,
            senderName: req.user?.username || 'System',
            senderRole: req.user?.role || 'system',
            isPersonal: type === 'message',
            relatedCaseId: relatedCaseId || null
        });

        await notification.save();

        // Populate related case info before returning
        await notification.populate('relatedCaseId', 'caseId caseName');
        await notification.populate('senderId', 'username name role avatar');

        // Send real-time notification to the user
        const notificationData = {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            senderName: notification.senderName,
            senderRole: notification.senderRole,
            relatedCaseId: notification.relatedCaseId,
            isPersonal: notification.isPersonal,
            createdAt: notification.createdAt
        };

        sendNotificationToUser(req.app.get('io'), userId, notificationData);
        
        // Update unread count for the user
        updateUnreadCount(req.app.get('io'), userId);

        res.status(201).json(notification);
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/notifications/send - Send a personal message to another user
 */
const sendMessage = async (req, res) => {
    try {
        const { receiverId, targetRole, userIds, title, message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        let targetIds = [];

        // Scenario 1: Specific Role
        if (targetRole) {
            const users = await User.find({ role: targetRole });
            targetIds = users.map(u => u._id);
        } 
        // Scenario 2: Array of IDs
        else if (Array.isArray(userIds) && userIds.length > 0) {
            targetIds = userIds;
        }
        // Scenario 3: Single ID (backward compatibility)
        else if (receiverId) {
            targetIds = [receiverId];
        }

        if (targetIds.length === 0) {
            return res.status(400).json({ message: 'No valid recipients specified' });
        }

        const notifications = targetIds.map(uid => ({
            userId: uid,
            senderId: req.user._id,
            senderName: req.user.username,
            senderRole: req.user.role,
            title: title || `Intel from ${req.user.username}`,
            message,
            type: 'message',
            isPersonal: true,
            createdAt: new Date()
        }));

        const results = await Notification.insertMany(notifications);
        
        // Send real-time notifications to all recipients
        const notificationData = {
            title: title || `Intel from ${req.user.username}`,
            message,
            type: 'message',
            senderName: req.user.username,
            senderRole: req.user.role,
            isPersonal: true,
            createdAt: new Date()
        };

        // Send to each recipient
        targetIds.forEach(userId => {
            sendNotificationToUser(req.app.get('io'), userId, notificationData);
            updateUnreadCount(req.app.get('io'), userId);
        });
        
        res.status(201).json({
            message: `Message sent to ${targetIds.length} recipient(s)`,
            count: results.length
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PATCH /api/notifications/:id/read - Mark a notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        // Update unread count for the user
        updateUnreadCount(req.app.get('io'), req.user._id);

        res.json(notification);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read for the user
 */
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        // Update unread count for the user
        updateUnreadCount(req.app.get('io'), req.user._id);

        res.json({ 
            message: 'All notifications marked as read',
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/notifications/broadcast - Create notifications for multiple users (Admin only)
 */
const broadcastNotification = async (req, res) => {
    try {
        const { userIds, title, message, type, relatedCaseId } = req.body;

        // Validate admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds array is required' });
        }

        if (!title || !message || !type) {
            return res.status(400).json({ 
                message: 'title, message, and type are required' 
            });
        }

        // Validate all users exist
        const users = await User.find({ '_id': { $in: userIds } });
        if (users.length !== userIds.length) {
            return res.status(400).json({ message: 'One or more users not found' });
        }

        // Create notifications for all users
        const notifications = userIds.map(userId => ({
            userId,
            title,
            message,
            type,
            relatedCaseId: relatedCaseId || null
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        // Send real-time notifications to all users
        const notificationData = {
            title,
            message,
            type,
            senderName: req.user.username,
            senderRole: req.user.role,
            relatedCaseId: relatedCaseId || null,
            createdAt: new Date()
        };

        // Send to each user
        userIds.forEach(userId => {
            sendNotificationToUser(req.app.get('io'), userId, notificationData);
            updateUnreadCount(req.app.get('io'), userId);
        });

        res.status(201).json({
            message: `Broadcast sent to ${userIds.length} users`,
            notifications: createdNotifications
        });
    } catch (error) {
        console.error('Broadcast notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    broadcastNotification,
    sendMessage
};
