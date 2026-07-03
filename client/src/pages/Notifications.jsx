import React from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, Info, FileText, Users, Activity } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Notifications = () => {
    const { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification 
    } = useNotification();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'case':
                return <FileText className="text-blue-400" />;
            case 'evidence':
                return <Activity className="text-green-400" />;
            case 'report':
                return <FileText className="text-purple-400" />;
            case 'message':
                return <Users className="text-indigo-400" />;
            case 'system':
                return <Info className="text-gray-400" />;
            case 'warning':
                return <AlertTriangle className="text-yellow-400" />;
            default:
                return <Bell className="text-gray-400" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'case':
                return 'bg-blue-500/10 border-blue-500/20';
            case 'evidence':
                return 'bg-green-500/10 border-green-500/20';
            case 'report':
                return 'bg-purple-500/10 border-purple-500/20';
            case 'message':
                return 'bg-indigo-500/10 border-indigo-500/20';
            case 'system':
                return 'bg-gray-500/10 border-gray-500/20';
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'bg-gray-500/10 border-gray-500/20';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-2 flex items-center gap-3">
                            <Bell className="text-blue-400" />
                            Notifications
                        </h1>
                        <p className="text-gray-400">Manage your notifications and stay updated</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                                Mark All as Read ({unreadCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{notifications.length}</p>
                            </div>
                            <Bell className="text-blue-400 w-8 h-8" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Unread</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{unreadCount}</p>
                            </div>
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-black dark:text-white text-sm font-bold">{unreadCount}</span>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Read</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{notifications.length - unreadCount}</p>
                            </div>
                            <CheckCircle className="text-green-400 w-8 h-8" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Today</p>
                                <p className="text-white text-2xl font-bold">
                                    {notifications.filter(n => {
                                        const today = new Date().toDateString();
                                        return new Date(n.createdAt).toDateString() === today;
                                    }).length}
                                </p>
                            </div>
                            <Clock className="text-purple-400 w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="card">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-black dark:text-white">All Notifications</h2>
                </div>
                
                {(!notifications || notifications.length === 0) ? (
                    <div className="text-center py-12">
                        <Bell size={48} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No notifications yet</p>
                        <p className="text-gray-500 text-sm mt-2">You'll see notifications here when they arrive</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {notifications?.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors ${
                                    !notification.isRead ? 'bg-blue-500/5' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold text-black dark:text-white mb-1 ${!notification.isRead ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>{notification.senderName || 'System'}</span>
                                                    <span>·</span>
                                                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notification._id)}
                                                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <CheckCircle size={16} className="text-green-400" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification._id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="text-red-400 text-sm">×</span>
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
        </div>
    );
};

export default Notifications;
