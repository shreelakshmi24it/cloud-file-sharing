import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as settingsService from '../services/settingsService';
import {
    ArrowLeft,
    User,
    Lock,
    Bell,
    Shield,
    HardDrive,
    Trash2,
    Save,
    Eye,
    EyeOff,
    Camera,
    Mail,
    Phone,
    Globe,
    Key,
    Download,
    AlertTriangle,
    CheckCircle,
    X
} from 'lucide-react';

type TabType = 'profile' | 'security' | 'notifications' | 'storage' | 'privacy';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const [, setLoading] = useState(false);

    // Profile settings
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        location: user?.location || '',
    });

    // Security settings
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: user?.two_factor_enabled || false,
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; qrCode: string } | null>(null);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [activeSessions, setActiveSessions] = useState<any[]>([]);

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: true,
        file_shared_notifications: true,
        storage_alerts: true,
        security_alerts: true,
        weekly_reports: false,
    });

    // Privacy settings
    const [privacySettings, setPrivacySettings] = useState({
        profile_visibility: 'private',
        activity_tracking: true,
        data_collection: true,
    });

    // Load data on mount
    useEffect(() => {
        loadSettingsData();
    }, [user]);

    const loadSettingsData = async () => {
        try {
            setLoading(true);
            // Load notification preferences
            const notifPrefs = await settingsService.getNotificationPreferences();
            if (notifPrefs.preferences) {
                setNotificationSettings(notifPrefs.preferences);
            }

            // Load privacy settings
            const privacyData = await settingsService.getPrivacySettings();
            if (privacyData.privacy) {
                setPrivacySettings(privacyData.privacy);
            }

            // Load active sessions if on security tab
            if (activeTab === 'security') {
                await loadActiveSessions();
            }

            // Update profile data from user
            if (user) {
                setProfileData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    bio: user.bio || '',
                    location: user.location || '',
                });
                setSecurityData(prev => ({
                    ...prev,
                    twoFactorEnabled: user.two_factor_enabled || false,
                }));
            }
        } catch (err: any) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveSessions = async () => {
        try {
            const sessionsData = await settingsService.getActiveSessions();
            setActiveSessions(sessionsData.sessions || []);
        } catch (err: any) {
            console.error('Failed to load sessions:', err);
        }
    };

    const handleProfileSave = async () => {
        try {
            setIsSaving(true);
            setError('');
            setSaveSuccess(false);

            const response = await settingsService.updateProfile(profileData);

            // Update the user in AuthContext and localStorage
            if (response.user) {
                updateUser(response.user);
            }

            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        try {
            setError('');
            setSaveSuccess(false);

            if (!securityData.currentPassword || !securityData.newPassword) {
                setError('Please fill in all password fields');
                return;
            }

            if (securityData.newPassword !== securityData.confirmPassword) {
                setError('New passwords do not match');
                return;
            }

            if (securityData.newPassword.length < 8) {
                setError('New password must be at least 8 characters');
                return;
            }

            setIsSaving(true);
            await settingsService.changePassword(
                securityData.currentPassword,
                securityData.newPassword
            );

            setSecurityData({
                ...securityData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to change password');
            setIsSaving(false);
        }
    };

    const handleEnable2FA = async () => {
        try {
            setError('');
            const result = await settingsService.enableTwoFactor();
            setTwoFactorSetup({
                secret: result.secret,
                qrCode: result.qrCode,
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to enable 2FA');
        }
    };

    const handleVerify2FA = async () => {
        try {
            setError('');
            if (!twoFactorSetup || !twoFactorToken) {
                setError('Please enter the verification code');
                return;
            }

            await settingsService.verifyTwoFactor(twoFactorToken, twoFactorSetup.secret);

            setSecurityData({ ...securityData, twoFactorEnabled: true });
            setTwoFactorSetup(null);
            setTwoFactorToken('');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to verify 2FA');
        }
    };

    const handleDisable2FA = async () => {
        try {
            const password = prompt('Enter your password to disable 2FA:');
            if (!password) return;

            setError('');
            await settingsService.disableTwoFactor(password);

            setSecurityData({ ...securityData, twoFactorEnabled: false });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to disable 2FA');
        }
    };

    const handleToggle2FA = async () => {
        if (securityData.twoFactorEnabled) {
            await handleDisable2FA();
        } else {
            await handleEnable2FA();
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setError('');
            await settingsService.revokeSession(sessionId);
            await loadActiveSessions();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to revoke session');
        }
    };

    const handleNotificationSave = async () => {
        try {
            setIsSaving(true);
            setError('');
            setSaveSuccess(false);

            await settingsService.updateNotificationPreferences(notificationSettings);

            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update notifications');
            setIsSaving(false);
        }
    };

    const handlePrivacySave = async () => {
        try {
            setIsSaving(true);
            setError('');
            setSaveSuccess(false);

            await settingsService.updatePrivacySettings(privacySettings);

            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update privacy settings');
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmText = prompt(
            'This action cannot be undone. Type "DELETE" to confirm:'
        );
        if (confirmText !== 'DELETE') return;

        const password = prompt('Enter your password to confirm account deletion:');
        if (!password) return;

        try {
            setError('');
            await settingsService.deleteAccount(password);
            alert('Account deleted successfully');
            logout();
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete account');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const storagePercentage = user
        ? (user.storage_used / user.storage_limit) * 100
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition touch-manipulation flex-shrink-0"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            </button>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Settings</h1>
                        </div>
                        {saveSuccess && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 sm:px-4 py-2 rounded-lg flex-shrink-0">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Settings saved!</span>
                                <span className="text-xs font-medium sm:hidden">Saved!</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2 rounded-lg flex-shrink-0">
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{error}</span>
                                <span className="text-xs font-medium sm:hidden">Error</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        {/* Mobile: Horizontal Scroll Tabs */}
                        <div className="lg:hidden bg-white rounded-lg shadow-md p-2 mb-4 overflow-x-auto">
                            <div className="flex gap-2 min-w-max">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap touch-manipulation ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <User className="h-4 w-4" />
                                    <span className="font-medium text-sm">Profile</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap touch-manipulation ${activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Lock className="h-4 w-4" />
                                    <span className="font-medium text-sm">Security</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap touch-manipulation ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Bell className="h-4 w-4" />
                                    <span className="font-medium text-sm">Notifications</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('storage')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap touch-manipulation ${activeTab === 'storage' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <HardDrive className="h-4 w-4" />
                                    <span className="font-medium text-sm">Storage</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('privacy')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap touch-manipulation ${activeTab === 'privacy' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Shield className="h-4 w-4" />
                                    <span className="font-medium text-sm">Privacy</span>
                                </button>
                            </div>
                        </div>

                        {/* Desktop: Vertical Tabs */}
                        <div className="hidden lg:block bg-white rounded-lg shadow-md p-4 space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition touch-manipulation ${activeTab === 'profile'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <User className="h-5 w-5" />
                                <span className="font-medium">Profile</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'security'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Lock className="h-5 w-5" />
                                <span className="font-medium">Security</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'notifications'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Bell className="h-5 w-5" />
                                <span className="font-medium">Notifications</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('storage')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'storage'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <HardDrive className="h-5 w-5" />
                                <span className="font-medium">Storage</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('privacy')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'privacy'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Shield className="h-5 w-5" />
                                <span className="font-medium">Privacy</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                                        <p className="text-sm text-gray-600 mb-6">Update your account's profile information and email address.</p>
                                    </div>

                                    {/* Profile Photo */}
                                    <div className="flex items-center space-x-6">
                                        <div className="relative">
                                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition">
                                                <Camera className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{user?.name}</h3>
                                            <p className="text-sm text-gray-600">{user?.email}</p>
                                            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                                                Change Photo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Location
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={profileData.location}
                                                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                    placeholder="City, Country"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            rows={4}
                                            placeholder="Tell us about yourself..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        onClick={handleProfileSave}
                                        disabled={isSaving}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        <Save className="h-5 w-5" />
                                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                                        <p className="text-sm text-gray-600 mb-6">Manage your password and security preferences.</p>
                                    </div>

                                    {/* Change Password */}
                                    <div className="border-b pb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type={showPasswords.current ? 'text' : 'password'}
                                                        value={securityData.currentPassword}
                                                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                                        className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                    >
                                                        {showPasswords.current ? (
                                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type={showPasswords.new ? 'text' : 'password'}
                                                        value={securityData.newPassword}
                                                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                                        className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                    >
                                                        {showPasswords.new ? (
                                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type={showPasswords.confirm ? 'text' : 'password'}
                                                        value={securityData.confirmPassword}
                                                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                        className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                                    >
                                                        {showPasswords.confirm ? (
                                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handlePasswordChange}
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </div>

                                    {/* Two-Factor Authentication */}
                                    <div className="border-b pb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securityData.twoFactorEnabled}
                                                    onChange={handleToggle2FA}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Active Sessions */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
                                        <div className="space-y-3">
                                            {activeSessions.length === 0 ? (
                                                <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                                                    No active sessions found
                                                </div>
                                            ) : (
                                                activeSessions.map((session) => (
                                                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`h-10 w-10 ${session.is_current ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                                                                    <Key className={`h-5 w-5 ${session.is_current ? 'text-green-600' : 'text-gray-600'}`} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {session.is_current ? 'Current Session' : (session.device_name || 'Unknown Device')}
                                                                    </p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {session.browser && session.os ? `${session.browser} on ${session.os}` : 'Browser'} • {session.location || 'Unknown location'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        Last active: {new Date(session.last_active).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {session.is_current ? (
                                                                <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">Active</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRevokeSession(session.id)}
                                                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* 2FA Setup Modal */}
                                    {twoFactorSetup && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                            <div className="bg-white rounded-lg max-w-md w-full p-6">
                                                <h3 className="text-xl font-bold mb-4">Set Up Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                                </p>
                                                <div className="flex justify-center mb-4">
                                                    <img src={twoFactorSetup.qrCode} alt="QR Code" className="w-48 h-48" />
                                                </div>
                                                <p className="text-xs text-gray-500 mb-4 text-center">
                                                    Secret: {twoFactorSetup.secret}
                                                </p>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Enter verification code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={twoFactorToken}
                                                        onChange={(e) => setTwoFactorToken(e.target.value)}
                                                        placeholder="000000"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        maxLength={6}
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setTwoFactorSetup(null);
                                                            setTwoFactorToken('');
                                                        }}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleVerify2FA}
                                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                                        <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.entries({
                                            email_notifications: {
                                                title: 'Email Notifications',
                                                description: 'Receive email notifications for important updates'
                                            },
                                            file_shared_notifications: {
                                                title: 'File Shared Notifications',
                                                description: 'Get notified when someone shares a file with you'
                                            },
                                            storage_alerts: {
                                                title: 'Storage Alerts',
                                                description: 'Alerts when your storage is running low'
                                            },
                                            security_alerts: {
                                                title: 'Security Alerts',
                                                description: 'Important security and account notifications'
                                            },
                                            weekly_reports: {
                                                title: 'Weekly Reports',
                                                description: 'Weekly summary of your account activity'
                                            }
                                        }).map(([key, { title, description }]) => (
                                            <div key={key} className="flex items-center justify-between py-3 border-b">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{title}</h3>
                                                    <p className="text-sm text-gray-600">{description}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notificationSettings[key as keyof typeof notificationSettings]}
                                                        onChange={(e) => setNotificationSettings({
                                                            ...notificationSettings,
                                                            [key]: e.target.checked
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleNotificationSave}
                                        disabled={isSaving}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        <Save className="h-5 w-5" />
                                        <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                                    </button>
                                </div>
                            )}

                            {/* Storage Tab */}
                            {activeTab === 'storage' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Storage Management</h2>
                                        <p className="text-sm text-gray-600 mb-6">Monitor and manage your storage usage.</p>
                                    </div>

                                    {/* Storage Overview */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {storagePercentage.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                                            <div
                                                className={`h-full rounded-full transition-all ${storagePercentage > 90 ? 'bg-red-500' :
                                                    storagePercentage > 70 ? 'bg-yellow-500' :
                                                        'bg-blue-600'
                                                    }`}
                                                style={{ width: `${storagePercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {formatBytes(user?.storage_used || 0)} of {formatBytes(user?.storage_limit || 0)} used
                                        </p>
                                    </div>

                                    {/* Storage Breakdown */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Breakdown</h3>
                                        <div className="border border-gray-200 rounded-lg p-6 text-center">
                                            <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600 mb-2">Detailed storage breakdown coming soon</p>
                                            <p className="text-xs text-gray-500">
                                                Currently showing total storage: {formatBytes(user?.storage_used || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => alert('Storage upgrade feature coming soon! Contact support for storage plan options.')}
                                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <Download className="h-5 w-5" />
                                            <span>Upgrade Storage</span>
                                        </button>
                                        <button
                                            onClick={() => alert('Clear trash functionality will permanently delete all trashed files. This feature is coming soon.')}
                                            className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                            <span>Clear Trash</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Privacy Tab */}
                            {activeTab === 'privacy' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
                                        <p className="text-sm text-gray-600 mb-6">Control your privacy and data preferences.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="border-b pb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Profile Visibility</h3>
                                                    <p className="text-sm text-gray-600">Control who can see your profile</p>
                                                </div>
                                                <select
                                                    value={privacySettings.profile_visibility}
                                                    onChange={(e) => setPrivacySettings({ ...privacySettings, profile_visibility: e.target.value })}
                                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                    <option value="contacts">Contacts Only</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-b pb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Activity Tracking</h3>
                                                    <p className="text-sm text-gray-600">Allow us to track your activity for analytics</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacySettings.activity_tracking}
                                                        onChange={(e) => setPrivacySettings({ ...privacySettings, activity_tracking: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="border-b pb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">Data Collection</h3>
                                                    <p className="text-sm text-gray-600">Allow us to collect data to improve our services</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacySettings.data_collection}
                                                        onChange={(e) => setPrivacySettings({ ...privacySettings, data_collection: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePrivacySave}
                                        disabled={isSaving}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        <Save className="h-5 w-5" />
                                        <span>{isSaving ? 'Saving...' : 'Save Privacy Settings'}</span>
                                    </button>

                                    {/* Danger Zone */}
                                    <div className="border-t pt-6 mt-8">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                            <div className="flex items-start space-x-3">
                                                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                                                    <p className="text-sm text-red-700 mb-4">
                                                        Once you delete your account, there is no going back. Please be certain.
                                                    </p>
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                                                    >
                                                        Delete Account
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;