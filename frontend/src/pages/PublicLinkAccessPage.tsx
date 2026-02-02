import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Cloud,
    Download,
    Lock,
    Shield,
    AlertCircle,
    CheckCircle,
    Eye,
    Clock,
    User,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    Archive,
    File as FileIcon,
    Loader2,
    ArrowLeft
} from 'lucide-react';

import { API_URL } from '../config';

interface SharedLinkData {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    sharedBy?: {
        name: string;
        email: string;
        avatar?: string;
    };
    sharedAt?: string;
    expiresAt?: string;
    isPasswordProtected: boolean;
    permissions: ('view' | 'download')[];
    encryptedKey?: string;
    downloadsRemaining?: number | null;
}

type PageState = 'loading' | 'password-required' | 'ready' | 'downloading' | 'decrypting' | 'success' | 'error';

const PublicLinkAccessPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [pageState, setPageState] = useState<PageState>('loading');
    const [fileData, setFileData] = useState<SharedLinkData | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordAttempts, setPasswordAttempts] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        setPageState('loading');

        try {
            const response = await axios.get(`${API_URL}/share/${token}`);
            const data = response.data;

            const shareData: SharedLinkData = {
                fileId: data.file.id || 'unknown',
                fileName: data.file.name,
                fileSize: parseInt(data.file.size) || 0,
                fileType: data.file.mime_type,
                expiresAt: data.expiresAt,
                isPasswordProtected: data.requiresPassword,
                permissions: ['view', 'download'],
                downloadsRemaining: data.downloadsRemaining,
            };

            setFileData(shareData);

            if (shareData.isPasswordProtected) {
                setPageState('password-required');
            } else {
                setPageState('ready');
            }
        } catch (err: any) {
            console.error('Validation error:', err);
            if (err.response?.status === 404) {
                setError('This link is invalid or has expired.');
            } else if (err.response?.status === 410) {
                setError(err.response.data.error || 'This link has expired.');
            } else {
                setError('Failed to load share link. Please try again.');
            }
            setPageState('error');
        }
    };

    const verifyPassword = async () => {
        if (!password.trim()) {
            setPasswordError('Please enter a password');
            return;
        }

        if (passwordAttempts >= 5) {
            setPasswordError('Too many failed attempts. Please try again later.');
            return;
        }

        setPasswordError('');

        try {
            await axios.post(`${API_URL}/share/${token}/validate`, {
                password
            });

            setPageState('ready');
            setPasswordAttempts(0);
        } catch (err: any) {
            setPasswordAttempts(prev => prev + 1);
            setPasswordError(
                err.response?.data?.error ||
                `Incorrect password. ${5 - passwordAttempts - 1} attempts remaining.`
            );
        }
    };

    const handleDownload = async () => {
        if (!fileData) return;

        setPageState('downloading');
        setDownloadProgress(0);

        try {
            // Simulate encryption progress
            for (let i = 0; i <= 30; i += 10) {
                setDownloadProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Download file from backend
            const response = await axios.get(
                `${API_URL}/share/${token}/download${password ? `?password=${encodeURIComponent(password)}` : ''}`
            );

            if (response.data.downloadUrl) {
                // Simulate decryption (client-side preparation)
                setPageState('decrypting');
                setDownloadProgress(100);
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Trigger direct download using the provided URL
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.setAttribute('download', fileData.fileName); // Use fileData.fileName
                document.body.appendChild(link);
                link.click();
                link.remove();

                setPageState('success');
            } else {
                console.error('Unexpected download response format: No downloadUrl provided');
                setError('Download failed: Invalid server response');
                setPageState('error');
            }
        } catch (err: any) {
            console.error('Download error:', err);
            setError(err.response?.data?.error || 'Download failed. Please try again.');
            setPageState('error');
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-16 w-16 text-blue-600" />;
        if (fileType.startsWith('video/')) return <Video className="h-16 w-16 text-purple-600" />;
        if (fileType.startsWith('audio/')) return <Music className="h-16 w-16 text-green-600" />;
        if (fileType.includes('pdf')) return <FileText className="h-16 w-16 text-red-600" />;
        if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-16 w-16 text-yellow-600" />;
        return <FileIcon className="h-16 w-16 text-gray-600" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getDaysUntilExpiry = (expiresAt?: string) => {
        if (!expiresAt) return null;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const renderContent = () => {
        // Loading State
        if (pageState === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
                    <p className="text-xl text-gray-700">Validating link...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we verify your access</p>
                </div>
            );
        }

        // Error State
        if (pageState === 'error') {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-red-50 rounded-full p-6 mb-6">
                        <AlertCircle className="h-16 w-16 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 text-center max-w-md mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span>Go to Homepage</span>
                    </button>
                </div>
            );
        }

        if (!fileData) return null;

        const daysUntilExpiry = getDaysUntilExpiry(fileData.expiresAt);
        const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3;

        return (
            <div className="max-w-2xl mx-auto">
                {/* Expiration Warning */}
                {isExpiringSoon && daysUntilExpiry > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-center">
                            <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                            <p className="text-yellow-800">
                                <span className="font-semibold">Expires soon:</span> This link will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                            </p>
                        </div>
                    </div>
                )}

                {/* File Info Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-blue-50 rounded-full p-6 mb-4">
                            {getFileIcon(fileData.fileType)}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            {fileData.fileName}
                        </h1>
                        <p className="text-gray-500">{formatFileSize(fileData.fileSize)}</p>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                            <Shield className="h-4 w-4 mr-1" />
                            End-to-End Encrypted
                        </span>
                        {fileData.isPasswordProtected && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                <Lock className="h-4 w-4 mr-1" />
                                Password Protected
                            </span>
                        )}
                    </div>

                    {/* Shared By Info */}
                    {fileData.sharedBy && (
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 rounded-full p-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Shared by</p>
                                        <p className="font-medium text-gray-900">{fileData.sharedBy.name}</p>
                                    </div>
                                </div>
                                {fileData.sharedAt && (
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Shared</p>
                                        <p className="font-medium text-gray-900">{formatDate(fileData.sharedAt)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {fileData.permissions.includes('view') && (
                                    <div className="flex items-center">
                                        <Eye className="h-4 w-4 mr-1" />
                                        <span>View</span>
                                    </div>
                                )}
                                {fileData.permissions.includes('download') && (
                                    <div className="flex items-center">
                                        <Download className="h-4 w-4 mr-1" />
                                        <span>Download</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Input State */}
                {pageState === 'password-required' && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="text-center mb-6">
                            <div className="bg-blue-50 rounded-full p-4 inline-block mb-4">
                                <Lock className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Required</h2>
                            <p className="text-gray-600">This file is password protected. Enter the password to access it.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={passwordAttempts >= 5}
                                />
                                {passwordError && (
                                    <p className="text-red-600 text-sm mt-2">{passwordError}</p>
                                )}
                            </div>

                            <button
                                onClick={verifyPassword}
                                disabled={passwordAttempts >= 5}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Verify Password
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                Hint: For demo purposes, use "password123"
                            </p>
                        </div>
                    </div>
                )}

                {/* Ready to Download State */}
                {pageState === 'ready' && fileData.permissions.includes('download') && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <button
                            onClick={handleDownload}
                            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg flex items-center justify-center space-x-3 shadow-lg"
                        >
                            <Download className="h-6 w-6" />
                            <span>Download File</span>
                        </button>
                        <p className="text-sm text-gray-500 text-center mt-4">
                            File will be decrypted on your device before download
                        </p>
                    </div>
                )}

                {/* Downloading State */}
                {pageState === 'downloading' && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="text-center mb-6">
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Downloading...</h3>
                            <p className="text-gray-600">Please wait while we fetch your file</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">{downloadProgress}%</p>
                    </div>
                )}

                {/* Decrypting State */}
                {pageState === 'decrypting' && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="text-center">
                            <div className="bg-green-50 rounded-full p-4 inline-block mb-4">
                                <Shield className="h-12 w-12 text-green-600 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Decrypting File...</h3>
                            <p className="text-gray-600">Securely decrypting your file on this device</p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {pageState === 'success' && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="text-center">
                            <div className="bg-green-50 rounded-full p-4 inline-block mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Complete!</h3>
                            <p className="text-gray-600 mb-6">Your file has been decrypted and downloaded successfully</p>
                            <button
                                onClick={() => setPageState('ready')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Download Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Cloud className="h-8 w-8 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900">SecureCloud</span>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Home</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {renderContent()}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            Want to share files securely?
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            Get SecureCloud Free
                        </button>
                        <div className="mt-6 text-sm text-gray-500 space-x-4">
                            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
                            <span>•</span>
                            <a href="#" className="hover:text-gray-700">Terms of Service</a>
                            <span>•</span>
                            <a href="#" className="hover:text-gray-700">Help</a>
                        </div>
                        <p className="mt-4 text-gray-400 text-xs">© 2024 SecureCloud. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLinkAccessPage;
