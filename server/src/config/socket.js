const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store user socket mappings
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user details
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            console.error('Socket authentication error:', err);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        const userRole = socket.user.role;
        
        console.log(`User connected: ${socket.user.username} (${userId}) - Role: ${userRole}`);

        // Store socket mapping
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);

        // Join user to their personal room
        socket.join(`user_${userId}`);

        // Join role-based rooms
        socket.join(`role_${userRole}`);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username} (${userId})`);
            
            // Clean up socket mappings
            userSockets.delete(userId);
            socketUsers.delete(socket.id);
        });

        // Handle join case room (for case-specific notifications)
        socket.on('join_case', (caseId) => {
            socket.join(`case_${caseId}`);
            console.log(`User ${socket.user.username} joined case room: ${caseId}`);
        });

        // Handle leave case room
        socket.on('leave_case', (caseId) => {
            socket.leave(`case_${caseId}`);
            console.log(`User ${socket.user.username} left case room: ${caseId}`);
        });

        // Handle mark notification as read
        socket.on('mark_notification_read', async (notificationId) => {
            try {
                const Notification = require('../models/Notification');
                await Notification.findByIdAndUpdate(
                    notificationId,
                    { isRead: true },
                    { new: true }
                );
                
                // Emit updated unread count
                const unreadCount = await Notification.countDocuments({
                    userId: userId,
                    isRead: false
                });
                
                socket.emit('unread_count_updated', { unreadCount });
            } catch (error) {
                console.error('Error marking notification as read:', error);
                socket.emit('notification_error', { message: 'Failed to mark notification as read' });
            }
        });
    });

    return io;
};

// Helper functions for sending notifications
const sendNotificationToUser = (io, userId, notificationData) => {
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('new_notification', notificationData);
        console.log(`Notification sent to user ${userId}: ${notificationData.title}`);
    }
};

const sendNotificationToRole = (io, role, notificationData) => {
    io.to(`role_${role}`).emit('new_notification', notificationData);
    console.log(`Notification sent to role ${role}: ${notificationData.title}`);
};

const sendNotificationToAll = (io, notificationData) => {
    io.emit('new_notification', notificationData);
    console.log(`Broadcast notification sent: ${notificationData.title}`);
};

const sendNotificationToCase = (io, caseId, notificationData) => {
    io.to(`case_${caseId}`).emit('new_notification', notificationData);
    console.log(`Notification sent to case ${caseId}: ${notificationData.title}`);
};

const getUnreadCount = async (userId) => {
    try {
        const Notification = require('../models/Notification');
        return await Notification.countDocuments({
            userId: userId,
            isRead: false
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

const updateUnreadCount = async (io, userId) => {
    const unreadCount = await getUnreadCount(userId);
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('unread_count_updated', { unreadCount });
    }
};

module.exports = {
    initializeSocket,
    sendNotificationToUser,
    sendNotificationToRole,
    sendNotificationToAll,
    sendNotificationToCase,
    getUnreadCount,
    updateUnreadCount,
    userSockets,
    socketUsers
};
