import db from '../database/connection';

export interface Share {
    id: string;
    file_id: string;
    shared_by: string;
    shared_with_email?: string;
    share_token: string;
    encrypted_key: string;
    password_hash?: string;
    permissions: string[];
    expires_at?: Date;
    max_downloads?: number;
    download_count: number;
    created_at: Date;
}

export interface CreateShareInput {
    file_id: string;
    shared_by: string;
    shared_with_email?: string;
    share_token: string;
    encrypted_key: string;
    password_hash?: string;
    expires_at?: Date;
    max_downloads?: number;
}

export interface ShareResponse {
    id: string;
    share_token: string;
    expires_at?: Date;
    max_downloads?: number;
    download_count: number;
    created_at: Date;
    share_url: string;
}

class ShareModel {
    async create(input: CreateShareInput): Promise<Share> {
        const query = `
      INSERT INTO shares (
        file_id, shared_by, shared_with_email, share_token, encrypted_key,
        password_hash, expires_at, max_downloads
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const result = await db.query(query, [
            input.file_id,
            input.shared_by,
            input.shared_with_email || null,
            input.share_token,
            input.encrypted_key,
            input.password_hash || null,
            input.expires_at || null,
            input.max_downloads || null,
        ]);

        return result.rows[0];
    }

    async findByToken(token: string): Promise<Share | null> {
        const query = 'SELECT * FROM shares WHERE share_token = $1';
        const result = await db.query(query, [token]);
        return result.rows[0] || null;
    }

    async findById(id: string): Promise<Share | null> {
        const query = 'SELECT * FROM shares WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    }

    async findByFileId(fileId: string): Promise<Share[]> {
        const query = `
      SELECT * FROM shares 
      WHERE file_id = $1
      ORDER BY created_at DESC
    `;
        const result = await db.query(query, [fileId]);
        return result.rows;
    }

    async findBySharedWithUser(userEmail: string): Promise<any[]> {
        const query = `
      SELECT 
        s.*,
        f.id as file_id,
        f.original_name as file_name,
        f.size as file_size,
        f.mime_type as file_mime_type,
        f.storage_path as file_storage_path,
        u.id as shared_by_id,
        u.name as shared_by_name,
        u.email as shared_by_email
      FROM shares s
      INNER JOIN files f ON s.file_id = f.id
      INNER JOIN users u ON s.shared_by = u.id
      WHERE s.shared_with_email = $1
        AND f.is_deleted = FALSE
      ORDER BY s.created_at DESC
    `;
        const result = await db.query(query, [userEmail]);
        return result.rows;
    }

    async incrementDownloadCount(id: string): Promise<void> {
        const query = `
      UPDATE shares 
      SET download_count = download_count + 1
      WHERE id = $1
    `;
        await db.query(query, [id]);
    }

    async delete(id: string): Promise<void> {
        const query = 'DELETE FROM shares WHERE id = $1';
        await db.query(query, [id]);
    }

    isExpired(share: Share): boolean {
        if (!share.expires_at) return false;
        return new Date() > new Date(share.expires_at);
    }

    hasReachedDownloadLimit(share: Share): boolean {
        if (!share.max_downloads) return false;
        return share.download_count >= share.max_downloads;
    }

    toResponse(share: Share, baseUrl: string = 'http://localhost:5173'): ShareResponse {
        return {
            id: share.id,
            share_token: share.share_token,
            expires_at: share.expires_at,
            max_downloads: share.max_downloads,
            download_count: share.download_count,
            created_at: share.created_at,
            share_url: `${baseUrl}/share/${share.share_token}`,
        };
    }
}

export default new ShareModel();
