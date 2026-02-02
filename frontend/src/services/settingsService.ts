import axios from 'axios';

import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Password Management
export const changePassword = async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/settings/password/change', {
        currentPassword,
        newPassword,
    });
    return response.data;
};

// Two-Factor Authentication
export const enableTwoFactor = async () => {
    const response = await api.post('/settings/2fa/enable');
    return response.data;
};

export const verifyTwoFactor = async (token: string, secret: string) => {
    const response = await api.post('/settings/2fa/verify', { token, secret });
    return response.data;
};

export const disableTwoFactor = async (password: string) => {
    const response = await api.post('/settings/2fa/disable', { password });
    return response.data;
};

// Profile Management
export const updateProfile = async (profileData: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    location?: string;
}) => {
    const response = await api.put('/settings/profile', profileData);
    return response.data;
};

// Session Management
export const getActiveSessions = async () => {
    const response = await api.get('/settings/sessions');
    return response.data;
};

export const revokeSession = async (sessionId: string) => {
    const response = await api.delete(`/settings/sessions/${sessionId}`);
    return response.data;
};

// Notification Preferences
export const getNotificationPreferences = async () => {
    const response = await api.get('/settings/notifications');
    return response.data;
};

export const updateNotificationPreferences = async (preferences: {
    email_notifications?: boolean;
    file_shared_notifications?: boolean;
    storage_alerts?: boolean;
    security_alerts?: boolean;
    weekly_reports?: boolean;
}) => {
    const response = await api.put('/settings/notifications', preferences);
    return response.data;
};

// Privacy Settings
export const getPrivacySettings = async () => {
    const response = await api.get('/settings/privacy');
    return response.data;
};

export const updatePrivacySettings = async (settings: {
    profile_visibility?: string;
    activity_tracking?: boolean;
    data_collection?: boolean;
}) => {
    const response = await api.put('/settings/privacy', settings);
    return response.data;
};

// Account Deletion
export const deleteAccount = async (password: string) => {
    const response = await api.delete('/settings/account', {
        data: { password },
    });
    return response.data;
};
