import db from '../database/connection';

export interface NotificationPreferences {
    id: string;
    user_id: string;
    email_notifications: boolean;
    file_shared_notifications: boolean;
    storage_alerts: boolean;
    security_alerts: boolean;
    weekly_reports: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface UpdateNotificationPreferencesInput {
    email_notifications?: boolean;
    file_shared_notifications?: boolean;
    storage_alerts?: boolean;
    security_alerts?: boolean;
    weekly_reports?: boolean;
}

class NotificationPreferencesModel {
    async create(userId: string): Promise<NotificationPreferences> {
        const query = `
            INSERT INTO notification_preferences (user_id)
            VALUES ($1)
            RETURNING *
        `;

        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    async findByUserId(userId: string): Promise<NotificationPreferences | null> {
        const query = 'SELECT * FROM notification_preferences WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        return result.rows[0] || null;
    }

    async getOrCreate(userId: string): Promise<NotificationPreferences> {
        let preferences = await this.findByUserId(userId);
        if (!preferences) {
            preferences = await this.create(userId);
        }
        return preferences;
    }

    async update(
        userId: string,
        updates: UpdateNotificationPreferencesInput
    ): Promise<NotificationPreferences> {
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

        if (fields.length === 0) {
            return this.getOrCreate(userId);
        }

        values.push(userId);
        const query = `
            UPDATE notification_preferences 
            SET ${fields.join(', ')}
            WHERE user_id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

export default new NotificationPreferencesModel();
