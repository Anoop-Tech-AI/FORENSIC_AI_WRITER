import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config/api';

const SOCKET_URL = API_URL.replace('/api', '');

export const useSocket = () => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('forensic-token');
        if (!token) return;

        // Initialize socket
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true
        });

        socketRef.current.on('connect', () => {
            console.log('Socket Connected');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket Disconnected');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err.message);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const sendMessage = (eventName, data) => {
        if (socketRef.current) {
            socketRef.current.emit(eventName, data);
        }
    };

    const subscribeToEvent = (eventName, callback) => {
        if (socketRef.current) {
            socketRef.current.on(eventName, callback);
        }
    };

    const unsubscribeFromEvent = (eventName, callback) => {
        if (socketRef.current) {
            socketRef.current.off(eventName, callback);
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        sendMessage,
        subscribeToEvent,
        unsubscribeFromEvent
    };
};
