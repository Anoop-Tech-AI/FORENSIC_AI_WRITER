import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    return { Authorization: `Bearer ${token}` };
  };

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    if (token) {
      const newSocket = io(API_URL.replace('/api', ''), {
        auth: { token },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from notification server');
        setIsConnected(false);
      });

      // Listen for new notifications
      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      newSocket.on('unread_count_updated', ({ unreadCount }) => {
        setUnreadCount(unreadCount);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notifications`, { headers: getHeaders() });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`, { headers: getHeaders() });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isConnected, fetchNotifications, fetchUnreadCount]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(notif => notif._id === notificationId ? { ...notif, isRead: true } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, { headers: getHeaders() });
      
      if (socket) {
        socket.emit('mark_notification_read', notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [socket]);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      await axios.patch(`${API_URL}/notifications/read-all`, {}, { headers: getHeaders() });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      await axios.delete(`${API_URL}/notifications/${notificationId}`, { headers: getHeaders() });
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: () => { fetchNotifications(); fetchUnreadCount(); }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
