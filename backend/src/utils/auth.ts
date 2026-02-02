import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export interface JWTPayload {
    userId: string;
    email: string;
    is2FATemp?: boolean;
}

export function generateToken(payload: JWTPayload, expiresIn?: string): string {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: expiresIn || config.jwt.expiresIn,
    } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
}
