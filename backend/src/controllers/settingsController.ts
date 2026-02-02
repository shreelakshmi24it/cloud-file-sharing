import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import UserModel from '../models/User';
import SessionModel from '../models/Session';
import NotificationPreferencesModel from '../models/NotificationPreferences';
import { hashPassword, comparePassword } from '../utils/auth';

// Password Management
export async function changePassword(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current password and new password are required' });
            return;
        }

        if (newPassword.length < 8) {
            res.status(400).json({ error: 'New password must be at least 8 characters long' });
            return;
        }

        // Get user
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password
        const isValid = await comparePassword(currentPassword, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Current password is incorrect' });
            return;
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await UserModel.changePassword(userId, newPasswordHash);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}

// Two-Factor Authentication
export async function enableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.two_factor_enabled) {
            res.status(400).json({ error: '2FA is already enabled' });
            return;
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `SecureCloud (${user.email})`,
            length: 32,
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        res.status(200).json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: 'Scan the QR code with your authenticator app and verify to enable 2FA',
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
}

export async function verifyTwoFactor(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { token, secret } = req.body;

        if (!token || !secret) {
            res.status(400).json({ error: 'Token and secret are required' });
            return;
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2,
        });

        if (!verified) {
            res.status(401).json({ error: 'Invalid verification code' });
            return;
        }

        // Enable 2FA
        await UserModel.enableTwoFactor(userId, secret);

        res.status(200).json({ message: '2FA enabled successfully' });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
}

export async function disableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { password } = req.body;

        if (!password) {
            res.status(400).json({ error: 'Password is required to disable 2FA' });
            return;
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Incorrect password' });
            return;
        }

        // Disable 2FA
        await UserModel.disableTwoFactor(userId);

        res.status(200).json({ message: '2FA disabled successfully' });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
}

// Profile Management
export async function updateProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { name, email, phone, bio, location } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;

        const updatedUser = await UserModel.updateProfile(userId, updates);

        res.status(200).json({
            message: 'Profile updated successfully',
            user: UserModel.toResponse(updatedUser),
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}

// Session Management
export async function getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const currentSessionId = (req as any).sessionId;

        // Clean expired sessions first
        await SessionModel.cleanExpiredSessions();

        const sessions = await SessionModel.findByUserId(userId);
        const sessionResponses = sessions.map(session =>
            SessionModel.toResponse(session, currentSessionId)
        );

        res.status(200).json({ sessions: sessionResponses });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get active sessions' });
    }
}

export async function revokeSession(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { sessionId } = req.params;

        const session = await SessionModel.findById(sessionId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (session.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        await SessionModel.deleteById(sessionId);

        res.status(200).json({ message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
}

// Notification Preferences
export async function getNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;

        const preferences = await NotificationPreferencesModel.getOrCreate(userId);

        res.status(200).json({ preferences });
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Failed to get notification preferences' });
    }
}

export async function updateNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const updates = req.body;

        const preferences = await NotificationPreferencesModel.update(userId, updates);

        res.status(200).json({
            message: 'Notification preferences updated successfully',
            preferences,
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
}

// Privacy Settings
export async function getPrivacySettings(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({
            privacy: {
                profile_visibility: user.profile_visibility || 'private',
                activity_tracking: user.activity_tracking !== false,
                data_collection: user.data_collection !== false,
            },
        });
    } catch (error) {
        console.error('Get privacy settings error:', error);
        res.status(500).json({ error: 'Failed to get privacy settings' });
    }
}

export async function updatePrivacySettings(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { profile_visibility, activity_tracking, data_collection } = req.body;

        const updates: any = {};
        if (profile_visibility !== undefined) updates.profile_visibility = profile_visibility;
        if (activity_tracking !== undefined) updates.activity_tracking = activity_tracking;
        if (data_collection !== undefined) updates.data_collection = data_collection;

        await UserModel.updateProfile(userId, updates);

        res.status(200).json({ message: 'Privacy settings updated successfully' });
    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({ error: 'Failed to update privacy settings' });
    }
}

// Account Deletion
export async function deleteAccount(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const { password } = req.body;

        if (!password) {
            res.status(400).json({ error: 'Password is required to delete account' });
            return;
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Incorrect password' });
            return;
        }

        // Delete account (cascade will delete all related data)
        await UserModel.deleteAccount(userId);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
}
