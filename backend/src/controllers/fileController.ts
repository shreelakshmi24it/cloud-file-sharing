import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import FileModel from '../models/File';
import UserModel from '../models/User';
import fs from 'fs';
import crypto from 'crypto';
import { GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, isS3Storage } from '../middleware/upload';
import config from '../config';

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

        // Determine storage path (S3 Key or Local Path)
        const storagePath = (req.file as any).key || req.file.path;
        let fileSize = req.file.size;

        // Fix: If S3 upload and size is reported as 0 or undefined, fetch real size from S3
        if (isS3Storage && s3Client && !fileSize) {
            try {
                const headCommand = new HeadObjectCommand({
                    Bucket: config.aws.s3BucketName,
                    Key: storagePath,
                });
                const headData = await s3Client.send(headCommand);
                if (headData.ContentLength) {
                    fileSize = headData.ContentLength;
                }
            } catch (err) {
                console.error('Failed to fetch S3 object capability:', err);
                // Fallback to 0 if retrieval fails
                fileSize = 0;
            }
        }

        // Ensure fileSize is a number (handle undefined/null fallback)
        fileSize = fileSize || 0;

        // Create file record in database
        const file = await FileModel.create({
            user_id: userId,
            name: req.file.filename || (req.file as any).key || req.file.originalname,
            original_name: req.file.originalname,
            size: fileSize,
            mime_type: req.file.mimetype,
            encrypted_key: encryptedKey,
            storage_path: storagePath,
            folder_id: folder_id || undefined,
        });

        // Update user's storage usage
        await UserModel.updateStorageUsed(userId, fileSize);

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


        if (isS3Storage && s3Client) {
            // Generate Presigned URL for direct download
            try {
                const command = new GetObjectCommand({
                    Bucket: config.aws.s3BucketName,
                    Key: file.storage_path,
                    ResponseContentDisposition: `attachment; filename="${file.original_name}"`,
                    ResponseContentType: file.mime_type,
                });

                const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

                // Return Presigned URL to client (Frontend will handle the download)
                res.status(200).json({ downloadUrl: signedUrl });
                return;
            } catch (s3Error) {
                console.error('S3 Presigned URL Error:', s3Error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to generate download link' });
                }
                return;
            }
        } else {
            // Local fallback
            if (!fs.existsSync(file.storage_path)) {
                res.status(404).json({ error: 'File not found on storage' });
                return;
            }

            res.setHeader('Content-Type', file.mime_type);
            res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
            res.setHeader('Content-Length', file.size);

            // Stream file to response
            const fileStream = fs.createReadStream(file.storage_path);
            fileStream.pipe(res);
        }
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'File download failed' });
        }
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

        if (isS3Storage && s3Client) {
            // Delete from S3
            try {
                const command = new DeleteObjectCommand({
                    Bucket: config.aws.s3BucketName,
                    Key: file.storage_path,
                });
                await s3Client.send(command);
            } catch (s3Error) {
                console.error('S3 Delete Error (non-fatal):', s3Error);
                // Continue to delete from DB even if S3 fails (orphan cleanup logic might be needed later)
            }
        } else {
            // Delete file from disk
            if (fs.existsSync(file.storage_path)) {
                fs.unlinkSync(file.storage_path);
            }
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

