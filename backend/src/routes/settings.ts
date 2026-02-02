import { Router } from 'express';
import {
    changePassword,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    updateProfile,
    getActiveSessions,
    revokeSession,
    getNotificationPreferences,
    updateNotificationPreferences,
    getPrivacySettings,
    updatePrivacySettings,
    deleteAccount,
} from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Password Management
router.post('/password/change', changePassword);

// Two-Factor Authentication
router.post('/2fa/enable', enableTwoFactor);
router.post('/2fa/verify', verifyTwoFactor);
router.post('/2fa/disable', disableTwoFactor);

// Profile Management
router.put('/profile', updateProfile);

// Session Management
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:sessionId', revokeSession);

// Notification Preferences
router.get('/notifications', getNotificationPreferences);
router.put('/notifications', updateNotificationPreferences);

// Privacy Settings
router.get('/privacy', getPrivacySettings);
router.put('/privacy', updatePrivacySettings);

// Account Deletion
router.delete('/account', deleteAccount);

export default router;
