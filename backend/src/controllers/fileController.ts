import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import FileModel from '../models/File';
import UserModel from '../models/User';
import fs from 'fs';
import crypto from 'crypto';

export async function uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const userId = req.user!.userId;
        const { folder_id } = req.body;

        // Generate encrypted key (simulated for now)
        const encryptedKey = crypto.randomBytes(32).toString('hex');

        // Create file record in database
        const file = await FileModel.create({
            user_id: userId,
            name: req.file.filename,
            original_name: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype,
            encrypted_key: encryptedKey,
            storage_path: req.file.path,
            folder_id: folder_id || undefined,
        });

        // Update user's storage usage
        await UserModel.updateStorageUsed(userId, req.file.size);

        res.status(201).json({
            message: 'File uploaded successfully',
            file: FileModel.toResponse(file),
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
}

export async function getFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!.userId;
        const files = await FileModel.findByUserId(userId);

        res.status(200).json({
            files: files.map(file => FileModel.toResponse(file)),
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Failed to retrieve files' });
    }
}

export async function getFileById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const file = await FileModel.findById(id);

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check if user owns the file
        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.status(200).json({
            file: FileModel.toResponse(file),
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
}

export async function downloadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const file = await FileModel.findById(id);

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check if user owns the file
        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Check if file exists on disk
        if (!fs.existsSync(file.storage_path)) {
            res.status(404).json({ error: 'File not found on storage' });
            return;
        }

        // Set headers for download
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Length', file.size);

        // Stream file to response
        const fileStream = fs.createReadStream(file.storage_path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'File download failed' });
    }
}

export async function deleteFile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const file = await FileModel.findById(id);

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check if user owns the file
        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete file from disk
        if (fs.existsSync(file.storage_path)) {
            fs.unlinkSync(file.storage_path);
        }

        // Soft delete from database
        await FileModel.softDelete(id);

        // Update user's storage usage
        await UserModel.updateStorageUsed(userId, -file.size);

        res.status(200).json({
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
}

export async function moveFile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { folder_id } = req.body;
        const userId = req.user!.userId;

        const file = await FileModel.findById(id);

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check if user owns the file
        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Move file to folder
        const updatedFile = await FileModel.moveToFolder(id, folder_id || null);

        res.status(200).json({
            message: 'File moved successfully',
            file: FileModel.toResponse(updatedFile),
        });
    } catch (error) {
        console.error('Move file error:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
}

