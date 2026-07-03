import axios from 'axios';
import { API_URL } from './api';

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('forensic-token');
            localStorage.removeItem('user');
            localStorage.removeItem('forensic-user');
            // Redirect to login if needed
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
