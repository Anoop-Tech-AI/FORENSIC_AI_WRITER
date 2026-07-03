import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, X, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import Portal from './Portal';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    isConnected, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications 
  } = useNotification();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'case':
        return 'case';
      case 'evidence':
        return 'evidence';
      case 'report':
        return 'report';
      case 'message':
        return 'message';
      case 'system':
        return 'system';
      default:
        return 'notification';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'case':
        return 'bg-blue-500';
      case 'evidence':
        return 'bg-green-500';
      case 'report':
        return 'bg-purple-500';
      case 'message':
        return 'bg-indigo-500';
      case 'system':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors group"
        title="Notifications"
        style={{ position: 'relative', zIndex: 10001 }}
      >
        {/* Bell Icon */}
        <div className="relative">
          {isConnected ? (
            <BellRing size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          ) : (
            <Bell size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          )}
          
          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white dark:border-gray-900"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </div>

        {/* Connection Status Indicator */}
        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white dark:border-gray-900 {
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed right-6 top-16 lg:top-20 w-80 sm:w-96 max-h-[500px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[99999]"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-black dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={refreshNotifications}
                      disabled={isLoading}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={16} className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Mark all as read"
                      >
                        <CheckCheck size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Close"
                    >
                      <X size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px]">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No notifications yet</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">You'll see notifications here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-200 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Notification Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                            <span className="text-white text-xs font-semibold">
                              {getNotificationIcon(notification.type).charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${!notification.isRead ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {notification.senderName}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check size={14} className="text-gray-600 dark:text-gray-400" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDelete(e, notification._id)}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} className="text-gray-600 dark:text-gray-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/30">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                  >
                    Close notifications
                  </button>
                </div>
              )}
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
