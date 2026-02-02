import db from '../database/connection';

export interface File {
    id: string;
    user_id: string;
    name: string;
    original_name: string;
    size: number;
    mime_type: string;
    encrypted_key: string;
    storage_path: string;
    checksum?: string;
    folder_id?: string;
    version: number;
    is_deleted: boolean;
    deleted_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface CreateFileInput {
    user_id: string;
    name: string;
    original_name: string;
    size: number;
    mime_type: string;
    encrypted_key: string;
    storage_path: string;
    checksum?: string;
    folder_id?: string;
}

export interface FileResponse {
    id: string;
    name: string;
    original_name: string;
    size: number;
    mime_type: string;
    created_at: Date;
    updated_at: Date;
}

class FileModel {
    async create(input: CreateFileInput): Promise<File> {
        const query = `
      INSERT INTO files (
        user_id, name, original_name, size, mime_type, 
        encrypted_key, storage_path, checksum, folder_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

        const result = await db.query(query, [
            input.user_id,
            input.name,
            input.original_name,
            input.size,
            input.mime_type,
            input.encrypted_key,
            input.storage_path,
            input.checksum || null,
            input.folder_id || null,
        ]);

        return result.rows[0];
    }

    async findById(id: string): Promise<File | null> {
        const query = 'SELECT * FROM files WHERE id = $1 AND is_deleted = FALSE';
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    }

    async findByUserId(userId: string): Promise<File[]> {
        const query = `
      SELECT * FROM files 
      WHERE user_id = $1 AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async findByFolderId(folderId: string | null, userId: string): Promise<File[]> {
        const query = `
      SELECT * FROM files 
      WHERE user_id = $1 AND folder_id ${folderId ? '= $2' : 'IS NULL'} AND is_deleted = FALSE
      ORDER BY created_at DESC
    `;
        const params = folderId ? [userId, folderId] : [userId];
        const result = await db.query(query, params);
        return result.rows;
    }

    async moveToFolder(fileId: string, folderId: string | null): Promise<File> {
        const query = `
      UPDATE files 
      SET folder_id = $1
      WHERE id = $2
      RETURNING *
    `;
        const result = await db.query(query, [folderId, fileId]);
        return result.rows[0];
    }

    async update(id: string, updates: Partial<File>): Promise<File> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        values.push(id);
        const query = `
      UPDATE files 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async softDelete(id: string): Promise<void> {
        const query = `
      UPDATE files 
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE id = $1
    `;
        await db.query(query, [id]);
    }

    async hardDelete(id: string): Promise<void> {
        const query = 'DELETE FROM files WHERE id = $1';
        await db.query(query, [id]);
    }

    toResponse(file: File): FileResponse {
        return {
            id: file.id,
            name: file.name,
            original_name: file.original_name,
            size: file.size,
            mime_type: file.mime_type,
            created_at: file.created_at,
            updated_at: file.updated_at,
        };
    }
}

export default new FileModel();
