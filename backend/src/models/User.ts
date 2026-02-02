import db from '../database/connection';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
    location?: string;
    storage_used: number;
    storage_limit: number;
    public_key?: string;
    email_verified: boolean;
    email_verification_token?: string;
    two_factor_enabled: boolean;
    two_factor_secret?: string;
    profile_visibility: string;
    activity_tracking: boolean;
    data_collection: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserInput {
    email: string;
    password_hash: string;
    name: string;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
    location?: string;
    storage_used: number;
    storage_limit: number;
    email_verified: boolean;
    two_factor_enabled: boolean;
    profile_visibility: string;
    activity_tracking: boolean;
    data_collection: boolean;
    created_at: Date;
}

class UserModel {
    async create(input: CreateUserInput): Promise<User> {
        const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const result = await db.query(query, [
            input.email,
            input.password_hash,
            input.name,
        ]);

        return result.rows[0];
    }

    async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0] || null;
    }

    async findById(id: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    }

    async updateProfile(id: string, updates: Partial<User>): Promise<User> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        values.push(id);
        const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async updateStorageUsed(id: string, bytes: number): Promise<void> {
        const query = `
      UPDATE users 
      SET storage_used = storage_used + $1
      WHERE id = $2
    `;
        await db.query(query, [bytes, id]);
    }

    async changePassword(id: string, newPasswordHash: string): Promise<void> {
        const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
        await db.query(query, [newPasswordHash, id]);
    }

    async enableTwoFactor(id: string, secret: string): Promise<User> {
        const query = `
            UPDATE users 
            SET two_factor_enabled = true, two_factor_secret = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [secret, id]);
        return result.rows[0];
    }

    async disableTwoFactor(id: string): Promise<User> {
        const query = `
            UPDATE users 
            SET two_factor_enabled = false, two_factor_secret = NULL
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async deleteAccount(id: string): Promise<void> {
        const query = 'DELETE FROM users WHERE id = $1';
        await db.query(query, [id]);
    }

    toResponse(user: User): UserResponse {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            phone: user.phone,
            bio: user.bio,
            location: user.location,
            storage_used: parseInt(user.storage_used as any) || 0,
            storage_limit: parseInt(user.storage_limit as any) || 10737418240,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled,
            profile_visibility: user.profile_visibility || 'private',
            activity_tracking: user.activity_tracking !== false,
            data_collection: user.data_collection !== false,
            created_at: user.created_at,
        };
    }
}

export default new UserModel();
