import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check, X, FileText, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const NotificationPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef(null);

    const getRolePath = (path) => {
        if (user?.role === 'legal_advisor') return `/legal${path}`;
        if (user?.role === 'admin') return `/admin${path}`;
        return `/investigator${path}`;
    };

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Poll unread count even when closed
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'case': return <FileText size={16} className="text-blue-400" />;
            case 'case_created': return <FileText size={16} className="text-orange-400" />;
            case 'user_joined': return <Activity size={16} className="text-green-400" />;
            case 'evidence': return <Upload size={16} className="text-green-400" />;
            case 'report': return <Activity size={16} className="text-purple-400" />;
            case 'system': return <AlertCircle size={16} className="text-yellow-400" />;
            case 'remark': return <MessageSquare size={16} className="text-orange-400" />;
            case 'message': return <Mail size={16} className="text-blue-400" />;
            default: return <Mail size={16} className="text-gray-400" />;
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('forensic-token');
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setNotifications(Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data) ? data : []));
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            // Fallback to empty or keep current
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('forensic-token');
            await axios.patch(`${API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDeleteNotification = async (e, notificationId) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('forensic-token');
            await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                const token = localStorage.getItem('forensic-token');
                await axios.patch(`${API_URL}/notifications/${notification._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
        
        // Navigate based on type or link
        if (notification.link) {
            navigate(notification.link);
        } else {
            switch (notification.type) {
                case 'case': case 'case_created': navigate(getRolePath('/cases')); break;
                case 'evidence': navigate(getRolePath('/evidence')); break;
                case 'report': navigate(getRolePath('/reports')); break;
                case 'message': case 'user_joined': navigate(getRolePath('/messages')); break;
                default: break;
            }
        }
        setIsOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative z-[100]" ref={panelRef}>
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[100]">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-black dark:text-white">System Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck size={14} />
                                        Read All
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                                    aria-label="Close messages"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-600 dark:text-gray-500">
                                <Bell size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-gray-200 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                                            !notification.isRead ? 'bg-blue-500/10' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Message Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Message Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-medium ${
                                                                !notification.isRead ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                                {notification.senderName || notification.title}
                                                            </p>
                                                            {notification.senderRole && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-500 uppercase tracking-tighter">
                                                                    {notification.senderRole}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm mt-1 truncate ${
                                                            !notification.isRead ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center mt-2 text-xs text-gray-600 dark:text-gray-500 gap-1">
                                                            <Clock size={12} />
                                                            {new Date(notification.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNotifications(prev => 
                                                                        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                                                                    );
                                                                }}
                                                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteNotification(e, notification._id)}
                                                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Optional: navigate to a dedicated notifications page if it existed
                                }}
                                className="w-full text-center text-sm text-gray-600 dark:text-gray-400 cursor-default"
                            >
                                End of Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
