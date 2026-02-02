import db from '../database/connection';

export interface Folder {
    id: string;
    user_id: string;
    name: string;
    parent_folder_id?: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateFolderInput {
    user_id: string;
    name: string;
    parent_folder_id?: string;
}

export interface FolderResponse {
    id: string;
    name: string;
    parent_folder_id?: string;
    created_at: Date;
    updated_at: Date;
}

export interface FolderPathItem {
    id: string;
    name: string;
}

class FolderModel {
    async create(input: CreateFolderInput): Promise<Folder> {
        const query = `
      INSERT INTO folders (user_id, name, parent_folder_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const result = await db.query(query, [
            input.user_id,
            input.name,
            input.parent_folder_id || null,
        ]);

        return result.rows[0];
    }

    async findById(id: string): Promise<Folder | null> {
        const query = 'SELECT * FROM folders WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0] || null;
    }

    async findByUserId(userId: string): Promise<Folder[]> {
        const query = `
      SELECT * FROM folders 
      WHERE user_id = $1
      ORDER BY name ASC
    `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async findByParentId(parentId: string | null, userId: string): Promise<Folder[]> {
        const query = `
      SELECT * FROM folders 
      WHERE user_id = $1 AND parent_folder_id ${parentId ? '= $2' : 'IS NULL'}
      ORDER BY name ASC
    `;
        const params = parentId ? [userId, parentId] : [userId];
        const result = await db.query(query, params);
        return result.rows;
    }

    async getFolderPath(folderId: string): Promise<FolderPathItem[]> {
        // Recursive CTE to get the full path from root to the specified folder
        const query = `
      WITH RECURSIVE folder_path AS (
        -- Base case: start with the specified folder
        SELECT id, name, parent_folder_id, 1 as level
        FROM folders
        WHERE id = $1
        
        UNION ALL
        
        -- Recursive case: get parent folders
        SELECT f.id, f.name, f.parent_folder_id, fp.level + 1
        FROM folders f
        INNER JOIN folder_path fp ON f.id = fp.parent_folder_id
      )
      SELECT id, name
      FROM folder_path
      ORDER BY level DESC
    `;

        const result = await db.query(query, [folderId]);
        return result.rows;
    }

    async update(id: string, updates: Partial<Pick<Folder, 'name' | 'parent_folder_id'>>): Promise<Folder> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (updates.name !== undefined) {
            fields.push(`name = $${paramCount}`);
            values.push(updates.name);
            paramCount++;
        }

        if (updates.parent_folder_id !== undefined) {
            fields.push(`parent_folder_id = $${paramCount}`);
            values.push(updates.parent_folder_id);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const query = `
      UPDATE folders 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async delete(id: string): Promise<void> {
        // The database schema has ON DELETE CASCADE, so this will automatically
        // delete all subfolders and set folder_id to NULL for files
        const query = 'DELETE FROM folders WHERE id = $1';
        await db.query(query, [id]);
    }

    async moveFolder(folderId: string, newParentId: string | undefined): Promise<Folder> {
        // Check for circular reference (folder cannot be moved into itself or its descendants)
        if (newParentId) {
            const isDescendant = await this.isDescendant(folderId, newParentId);
            if (isDescendant) {
                throw new Error('Cannot move folder into its own descendant');
            }
        }

        return this.update(folderId, { parent_folder_id: newParentId });
    }

    async isDescendant(ancestorId: string, potentialDescendantId: string): Promise<boolean> {
        // Check if potentialDescendantId is a descendant of ancestorId
        const query = `
      WITH RECURSIVE descendants AS (
        SELECT id, parent_folder_id
        FROM folders
        WHERE id = $1
        
        UNION ALL
        
        SELECT f.id, f.parent_folder_id
        FROM folders f
        INNER JOIN descendants d ON f.parent_folder_id = d.id
      )
      SELECT EXISTS(SELECT 1 FROM descendants WHERE id = $2) as is_descendant
    `;

        const result = await db.query(query, [ancestorId, potentialDescendantId]);
        return result.rows[0].is_descendant;
    }

    toResponse(folder: Folder): FolderResponse {
        return {
            id: folder.id,
            name: folder.name,
            parent_folder_id: folder.parent_folder_id,
            created_at: folder.created_at,
            updated_at: folder.updated_at,
        };
    }
}

export default new FolderModel();
