import axios from 'axios';

import { API_URL } from '../config';

export interface SharedFile {
    id: string;
    file: {
        id: string;
        name: string;
        size: number;
        type: string;
    };
    sharedBy: {
        id: string;
        name: string;
        email: string;
    };
    shareToken: string;
    sharedAt: string;
    expiresAt?: string;
    permissions: string[];
    isPasswordProtected: boolean;
    downloadCount: number;
    maxDownloads?: number;
}

export const getSharedWithMe = async (): Promise<SharedFile[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/share/shared-with-me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data.shares;
};

export const downloadSharedFile = async (shareToken: string, password?: string): Promise<{ downloadUrl: string }> => {
    const url = password
        ? `${API_URL}/share/${shareToken}/download?password=${encodeURIComponent(password)}`
        : `${API_URL}/share/${shareToken}/download`;

    const response = await axios.get(url);

    return response.data;
};

export const removeShare = async (shareId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/share/${shareId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
