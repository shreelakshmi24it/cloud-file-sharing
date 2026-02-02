import db from '../database/connection';

export interface Session {
    id: string;
    user_id: string;
    token_hash: string;
    ip_address?: string;
    user_agent?: string;
    device_name?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    location?: string;
    last_active: Date;
    expires_at: Date;
    created_at: Date;
}

export interface CreateSessionInput {
    user_id: string;
    token_hash: string;
    ip_address?: string;
    user_agent?: string;
    device_name?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    location?: string;
    expires_at: Date;
}

export interface SessionResponse {
    id: string;
    device_name?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    location?: string;
    ip_address?: string;
    last_active: Date;
    created_at: Date;
    is_current: boolean;
}

class SessionModel {
    async create(input: CreateSessionInput): Promise<Session> {
        const query = `
            INSERT INTO sessions (
                user_id, token_hash, ip_address, user_agent,
                device_name, device_type, browser, os, location,
                expires_at, last_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *
        `;

        const result = await db.query(query, [
            input.user_id,
            input.token_hash,
            input.ip_address,
            input.user_agent,
            input.device_name,
            input.device_type,
            input.browser,
            input.os,
            input.location,
            input.expires_at,
        ]);

        return result.rows[0];
    }

    async findByUserId(userId: string): Promise<Session[]> {
        const query = `
            SELECT * FROM sessions 
            WHERE user_id = $1 AND expires_at > NOW()
            ORDER BY last_active DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async findById(id: string): Promise<Session | null> {
        const query = 'SELECT * FROM sessions WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    }

    async updateLastActive(id: string): Promise<void> {
        const query = 'UPDATE sessions SET last_active = NOW() WHERE id = $1';
        await db.query(query, [id]);
    }

    async deleteById(id: string): Promise<void> {
        const query = 'DELETE FROM sessions WHERE id = $1';
        await db.query(query, [id]);
    }

    async deleteByUserId(userId: string): Promise<void> {
        const query = 'DELETE FROM sessions WHERE user_id = $1';
        await db.query(query, [userId]);
    }

    async cleanExpiredSessions(): Promise<void> {
        const query = 'DELETE FROM sessions WHERE expires_at <= NOW()';
        await db.query(query);
    }

    toResponse(session: Session, currentSessionId?: string): SessionResponse {
        return {
            id: session.id,
            device_name: session.device_name,
            device_type: session.device_type,
            browser: session.browser,
            os: session.os,
            location: session.location,
            ip_address: session.ip_address,
            last_active: session.last_active,
            created_at: session.created_at,
            is_current: currentSessionId ? session.id === currentSessionId : false,
        };
    }
}

export default new SessionModel();
