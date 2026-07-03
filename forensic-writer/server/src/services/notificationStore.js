/**
 * In-memory Notification Store
 * Shared across routes for broadcast + per-user notifications
 */
const { v4: uuidv4 } = require('uuid');

// Singleton store
const notifications = [];

/**
 * Create a notification for a specific user
 */
const createNotification = ({ userId, title, message, type = 'info', link = null }) => {
    const n = {
        _id: `notif-${uuidv4()}`,
        userId: userId.toString(),
        title,
        message,
        type,       // 'case_created' | 'user_joined' | 'message' | 'info'
        link,       // e.g. '/cases/FW-4056'
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    notifications.push(n);
    return n;
};

/**
 * Broadcast a notification to a list of userIds
 */
const broadcastNotification = ({ userIds, title, message, type = 'info', link = null }) => {
    return userIds.map(uid => createNotification({ userId: uid, title, message, type, link }));
};

/**
 * Get notifications for a specific user (newest first)
 */
const getUserNotifications = (userId, limit = 50) => {
    return notifications
        .filter(n => n.userId === userId.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
};

/**
 * Get unread count for a user
 */
const getUnreadCount = (userId) => {
    return notifications.filter(n => n.userId === userId.toString() && !n.isRead).length;
};

/**
 * Mark a notification as read
 */
const markAsRead = (notifId) => {
    const n = notifications.find(n => n._id === notifId);
    if (n) n.isRead = true;
    return n;
};

/**
 * Mark all notifications for a user as read
 */
const markAllAsRead = (userId) => {
    notifications.forEach(n => {
        if (n.userId === userId.toString()) n.isRead = true;
    });
};

module.exports = {
    createNotification,
    broadcastNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
