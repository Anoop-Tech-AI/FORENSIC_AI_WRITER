const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// GET /api/notifications — get all notifications for current user
router.get('/', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        const userId = req.user._id;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.json({ success: true, notifications });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// GET /api/notifications/unread-count — badge count
router.get('/unread-count', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        const userId = req.user._id;
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        return res.json({ success: true, unreadCount });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        const userId = req.user._id;
        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
        return res.json({ success: true });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { $set: { isRead: true } },
            { new: true }
        );
        return res.json({ success: true, notification });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        await Notification.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// POST /api/notifications/broadcast — admin sends broadcast (internal use)
router.post('/broadcast', protect, async (req, res) => {
    try {
        console.log("Route hit:", req.originalUrl);
        const { userIds, title, message, type, link } = req.body;
        if (!userIds || !title || !message) return res.status(400).json({ message: 'userIds, title and message required' });
        
        const notifications = await Promise.all(
            userIds.map(userId => Notification.create({ userId, title, message, type: type || 'system', link }))
        );
        return res.status(201).json({ success: true, created: notifications.length });
    } catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;
