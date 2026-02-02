import { Request, Response } from 'express';
import UserModel from '../models/User';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth';
import { validate, registerSchema, loginSchema, AuthenticationError } from '../utils/validation';
import speakeasy from 'speakeasy';

export async function register(req: Request, res: Response): Promise<void> {
    try {
        // Validate input
        const validatedData = validate(registerSchema, req.body);

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(validatedData.email);
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const password_hash = await hashPassword(validatedData.password);

        // Create user
        const user = await UserModel.create({
            email: validatedData.email,
            password_hash,
            name: validatedData.name,
        });

        // Generate tokens
        const token = generateToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

        // Return user data and tokens
        res.status(201).json({
            message: 'User registered successfully',
            user: UserModel.toResponse(user),
            token,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        // Validate input
        const validatedData = validate(loginSchema, req.body);

        // Find user
        const user = await UserModel.findByEmail(validatedData.email);
        if (!user) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await comparePassword(validatedData.password, user.password_hash);
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            // Generate a temporary token valid for 5 minutes for 2FA verification
            const tempToken = generateToken(
                { userId: user.id, email: user.email, is2FATemp: true },
                '5m'
            );

            res.status(200).json({
                requires2FA: true,
                tempToken,
                message: 'Please enter your 2FA code',
            });
            return;
        }

        // Generate tokens
        const token = generateToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

        // Return user data and tokens
        res.status(200).json({
            message: 'Login successful',
            user: UserModel.toResponse(user),
            token,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            res.status(401).json({ error: error.message });
        } else if (error instanceof Error && error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
}

export async function verify2FALogin(req: Request, res: Response): Promise<void> {
    try {
        const { tempToken, twoFactorCode } = req.body;

        if (!tempToken || !twoFactorCode) {
            res.status(400).json({ error: 'Temporary token and 2FA code are required' });
            return;
        }

        // Verify temp token
        const decoded = (req as any).user; // This comes from auth middleware
        if (!decoded.is2FATemp) {
            res.status(401).json({ error: 'Invalid temporary token' });
            return;
        }

        const userId = decoded.userId;

        // Get user
        const user = await UserModel.findById(userId);
        if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
            res.status(401).json({ error: '2FA verification failed' });
            return;
        }

        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: twoFactorCode,
            window: 2, // Allow 2 time steps before/after for clock drift
        });

        if (!verified) {
            res.status(401).json({ error: 'Invalid 2FA code' });
            return;
        }

        // Generate real tokens
        const token = generateToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

        // Return user data and tokens
        res.status(200).json({
            message: 'Login successful',
            user: UserModel.toResponse(user),
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: '2FA verification failed' });
    }
}

export async function logout(_req: Request, res: Response): Promise<void> {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // If using sessions or token blacklist, implement here
    res.status(200).json({ message: 'Logout successful' });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({
            user: UserModel.toResponse(user),
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
}
