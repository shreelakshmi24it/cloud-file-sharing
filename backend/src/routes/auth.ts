import { Router } from 'express';
import { register, login, logout, getProfile, verify2FALogin } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// 2FA verification with auth middleware to verify temp token
router.post('/verify-2fa', authenticate, verify2FALogin);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

export default router;
