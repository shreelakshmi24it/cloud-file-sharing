import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import FolderModel from '../models/Folder';
import FileModel from '../models/File';

export async function createFolder(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { name, parent_folder_id } = req.body;
        const userId = req.user!.userId;

        if (!name || name.trim() === '') {
            res.status(400).json({ error: 'Folder name is required' });
            return;
        }

        // If parent_folder_id is provided, verify it exists and belongs to the user
        if (parent_folder_id) {
            const parentFolder = await FolderModel.findById(parent_folder_id);
            if (!parentFolder) {
                res.status(404).json({ error: 'Parent folder not found' });
                return;
            }
            if (parentFolder.user_id !== userId) {
                res.status(403).json({ error: 'Access denied to parent folder' });
                return;
            }
        }

        const folder = await FolderModel.create({
            user_id: userId,
            name: name.trim(),
            parent_folder_id: parent_folder_id || undefined,
        });

        res.status(201).json({
            message: 'Folder created successfully',
            folder: FolderModel.toResponse(folder),
        });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
}

export async function getFolders(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.userId;
        const { parent_id } = req.query;

        let folders;
        if (parent_id !== undefined) {
            // Get folders in a specific parent (or root if parent_id is null/empty)
            const parentFolderId = parent_id === '' || parent_id === 'null' ? null : parent_id as string;
            folders = await FolderModel.findByParentId(parentFolderId, userId);
        } else {
            // Get all folders for the user
            folders = await FolderModel.findByUserId(userId);
        }

        res.status(200).json({
            folders: folders.map(folder => FolderModel.toResponse(folder)),
        });
    } catch (error) {
        console.error('Get folders error:', error);
        res.status(500).json({ error: 'Failed to retrieve folders' });
    }
}

export async function getFolderById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const folder = await FolderModel.findById(id);

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        if (folder.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.status(200).json({
            folder: FolderModel.toResponse(folder),
        });
    } catch (error) {
        console.error('Get folder error:', error);
        res.status(500).json({ error: 'Failed to retrieve folder' });
    }
}

export async function getFolderContents(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // If id is 'root', get root-level contents
        const folderId = id === 'root' ? null : id;

        // Verify folder exists and belongs to user (if not root)
        if (folderId) {
            const folder = await FolderModel.findById(folderId);
            if (!folder) {
                res.status(404).json({ error: 'Folder not found' });
                return;
            }
            if (folder.user_id !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
        }

        // Get subfolders
        const folders = await FolderModel.findByParentId(folderId, userId);

        // Get files in this folder
        const files = await FileModel.findByFolderId(folderId, userId);

        res.status(200).json({
            folders: folders.map(folder => FolderModel.toResponse(folder)),
            files: files.map(file => FileModel.toResponse(file)),
        });
    } catch (error) {
        console.error('Get folder contents error:', error);
        res.status(500).json({ error: 'Failed to retrieve folder contents' });
    }
}

export async function getFolderPath(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const folder = await FolderModel.findById(id);

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        if (folder.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const path = await FolderModel.getFolderPath(id);

        res.status(200).json({
            path,
        });
    } catch (error) {
        console.error('Get folder path error:', error);
        res.status(500).json({ error: 'Failed to retrieve folder path' });
    }
}

export async function updateFolder(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { name, parent_folder_id } = req.body;
        const userId = req.user!.userId;

        const folder = await FolderModel.findById(id);

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        if (folder.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // If moving to a new parent, verify it exists and belongs to user
        if (parent_folder_id !== undefined && parent_folder_id !== null) {
            const parentFolder = await FolderModel.findById(parent_folder_id);
            if (!parentFolder) {
                res.status(404).json({ error: 'Parent folder not found' });
                return;
            }
            if (parentFolder.user_id !== userId) {
                res.status(403).json({ error: 'Access denied to parent folder' });
                return;
            }

            // Check for circular reference
            const isDescendant = await FolderModel.isDescendant(id, parent_folder_id);
            if (isDescendant || id === parent_folder_id) {
                res.status(400).json({ error: 'Cannot move folder into itself or its descendant' });
                return;
            }
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name.trim();
        if (parent_folder_id !== undefined) updates.parent_folder_id = parent_folder_id;

        const updatedFolder = await FolderModel.update(id, updates);

        res.status(200).json({
            message: 'Folder updated successfully',
            folder: FolderModel.toResponse(updatedFolder),
        });
    } catch (error) {
        console.error('Update folder error:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
}

export async function deleteFolder(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const folder = await FolderModel.findById(id);

        if (!folder) {
            res.status(404).json({ error: 'Folder not found' });
            return;
        }

        if (folder.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Get all files in this folder and subfolders recursively
        // We need to delete physical files and update storage before cascade delete
        const files = await getAllFilesInFolder(id);

        // Delete physical files from disk
        const fs = require('fs');
        let totalSize = 0;
        for (const file of files) {
            if (fs.existsSync(file.storage_path)) {
                fs.unlinkSync(file.storage_path);
            }
            totalSize += file.size;
        }

        // Delete folder (cascade will handle subfolders and files in database)
        await FolderModel.delete(id);

        // Update user's storage usage
        if (totalSize > 0) {
            const UserModel = require('../models/User').default;
            await UserModel.updateStorageUsed(userId, -totalSize);
        }

        res.status(200).json({
            message: 'Folder deleted successfully',
        });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
}

// Helper function to get all files in a folder and its subfolders recursively
async function getAllFilesInFolder(folderId: string): Promise<any[]> {
    // Use a recursive CTE to get all descendant folders and their files
    const query = `
        WITH RECURSIVE folder_tree AS (
            -- Base case: the folder itself
            SELECT id FROM folders WHERE id = $1
            UNION
            -- Recursive case: all descendant folders
            SELECT f.id FROM folders f
            INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
        )
        SELECT * FROM files 
        WHERE folder_id IN (SELECT id FROM folder_tree)
        AND is_deleted = FALSE
    `;

    const db = require('../database/connection').default;
    const result = await db.query(query, [folderId]);
    return result.rows;
}
