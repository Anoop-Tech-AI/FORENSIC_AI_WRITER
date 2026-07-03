import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

// Notification context state
const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isOpen: false
};

// Action types
const NOTIFICATION_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    MARK_AS_READ: 'MARK_AS_READ',
    MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
    DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
    SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
    TOGGLE_PANEL: 'TOGGLE_PANEL',
    CLOSE_PANEL: 'CLOSE_PANEL'
};

// Reducer function
const notificationReducer = (state, action) => {
    switch (action.type) {
        case NOTIFICATION_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        
        case NOTIFICATION_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        
        case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
            return {
                ...state,
                notifications: Array.isArray(action.payload.notifications) ? action.payload.notifications : [],
                unreadCount: typeof action.payload.unreadCount === 'number' ? action.payload.unreadCount : 0,
                loading: false,
                error: null
            };
        
        case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
                unreadCount: state.unreadCount + 1
            };
        
        case NOTIFICATION_ACTIONS.MARK_AS_READ:
            return {
                ...state,
                notifications: state.notifications.map(notification =>
                    notification._id === action.payload
                        ? { ...notification, isRead: true }
                        : notification
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        
        case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
            return {
                ...state,
                notifications: state.notifications.map(notification => ({
                    ...notification,
                    isRead: true
                })),
                unreadCount: 0
            };
        
        case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
            const deletedNotification = state.notifications.find(n => n._id === action.payload);
            return {
                ...state,
                notifications: state.notifications.filter(n => n._id !== action.payload),
                unreadCount: deletedNotification && !deletedNotification.isRead 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount
            };
        
        case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: action.payload
            };
        
        case NOTIFICATION_ACTIONS.TOGGLE_PANEL:
            return {
                ...state,
                isOpen: !state.isOpen
            };
        
        case NOTIFICATION_ACTIONS.CLOSE_PANEL:
            return {
                ...state,
                isOpen: false
            };
        
        default:
            return state;
    }
};

// Create context
const MessageContext = createContext();

// Provider component
export const MessageProvider = ({ children }) => {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('forensic-token');
    };

    // Get current user ID (helper function)
    const getCurrentUserId = () => {
        return user?._id || user?.id || null;
    };

    // Fetch notifications
    const fetchNotifications = async (page = 1, limit = 20) => {
        try {
            dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
            
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({
                type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
                payload: {
                    notifications: response.data?.notifications || [],
                    unreadCount: response.data?.unreadCount || 0
                }
            });

            return response.data;
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            dispatch({
                type: NOTIFICATION_ACTIONS.SET_ERROR,
                payload: error.response?.data?.message || 'Failed to fetch notifications'
            });
        }
    };

    // Get unread count
    const fetchUnreadCount = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({
                type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT,
                payload: response.data.unreadCount
            });

            return response.data.unreadCount;
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Create notification (admin only)
    const createNotification = async (notificationData) => {
        try {
            const token = getAuthToken();
            const response = await axios.post(`${API_URL}/notifications`, notificationData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Add to local state if it's for current user
            if (response.data.userId === getCurrentUserId()) {
                dispatch({
                    type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
                    payload: response.data
                });
            }

            return response.data;
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    };

    // Broadcast notification (admin only)
    const broadcastNotification = async (notificationData) => {
        try {
            const token = getAuthToken();
            const response = await axios.post(`${API_URL}/notifications/broadcast`, notificationData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error) {
            console.error('Failed to broadcast notification:', error);
            throw error;
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = getAuthToken();
            await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({
                type: NOTIFICATION_ACTIONS.MARK_AS_READ,
                payload: notificationId
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const token = getAuthToken();
            await axios.patch(`${API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            const token = getAuthToken();
            await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({
                type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION,
                payload: notificationId
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    };

    // Toggle notification panel
    const togglePanel = () => {
        dispatch({ type: NOTIFICATION_ACTIONS.TOGGLE_PANEL });
    };

    // Close notification panel
    const closePanel = () => {
        dispatch({ type: NOTIFICATION_ACTIONS.CLOSE_PANEL });
    };

    // Auto-refresh notifications periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (getAuthToken()) {
                fetchUnreadCount();
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Initial fetch
    useEffect(() => {
        const token = getAuthToken();
        if (token && token !== 'null' && token !== 'undefined') {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, []);

    const value = {
        // State
        ...state,
        
        // Actions
        fetchNotifications,
        fetchUnreadCount,
        createNotification,
        broadcastNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        togglePanel,
        closePanel,
        
        // Constants
        NOTIFICATION_ACTIONS
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};

// Hook to use message context
export const useMessages = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
};

export default MessageContext;
