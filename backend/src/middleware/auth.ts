import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';
import { AuthenticationError } from '../utils/validation';
import UserModel from '../models/User';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        // Verify user still exists
        const user = await UserModel.findById(payload.userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        req.user = payload;
        next();
    } catch (error) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' });
        } else if (error instanceof Error && error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token expired' });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Authentication failed' });
        }
    }
}
