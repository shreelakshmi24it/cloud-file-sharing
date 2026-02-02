import crypto from 'crypto';

export function generateShareToken(): string {
    // Generate a URL-safe random token
    return crypto.randomBytes(32).toString('base64url');
}

export function validateTokenFormat(token: string): boolean {
    // Check if token is valid base64url format and reasonable length
    return /^[A-Za-z0-9_-]{43}$/.test(token);
}
