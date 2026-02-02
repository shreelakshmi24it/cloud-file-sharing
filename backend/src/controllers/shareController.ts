import config from '../config';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, isS3Storage } from '../middleware/upload';
import { Readable } from 'stream';

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ShareModel from '../models/Share';
import FileModel from '../models/File';
import { generateShareToken } from '../utils/shareToken';
import { hashPassword, comparePassword } from '../utils/auth';
import crypto from 'crypto';
import fs from 'fs';

export async function createShare(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { fileId, password, expiresIn, maxDownloads, sharedWithEmail } = req.body;
        const userId = req.user!.userId;

        // Verify file exists and user owns it
        const file = await FileModel.findById(fileId);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Generate share token
        const shareToken = generateShareToken();

        // Hash password if provided
        const passwordHash = password ? await hashPassword(password) : undefined;

        // Calculate expiration date
        const expiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
            : undefined;

        // Generate encrypted key (simulated for now)
        const encryptedKey = crypto.randomBytes(32).toString('hex');

        // Create share
        const share = await ShareModel.create({
            file_id: fileId,
            shared_by: userId,
            shared_with_email: sharedWithEmail || undefined,
            share_token: shareToken,
            encrypted_key: encryptedKey,
            password_hash: passwordHash,
            expires_at: expiresAt,
            max_downloads: maxDownloads,
        });

        res.status(201).json({
            message: 'Share link created successfully',
            share: ShareModel.toResponse(share, config.frontendUrl),
        });
    } catch (error) {
        console.error('Create share error:', error);
        res.status(500).json({ error: 'Failed to create share link' });
    }
}

export async function getShare(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.params;

        const share = await ShareModel.findByToken(token);
        if (!share) {
            res.status(404).json({ error: 'Share link not found' });
            return;
        }

        // Check if expired
        if (ShareModel.isExpired(share)) {
            res.status(410).json({ error: 'Share link has expired' });
            return;
        }

        // Check download limit
        if (ShareModel.hasReachedDownloadLimit(share)) {
            res.status(410).json({ error: 'Download limit reached' });
            return;
        }

        // Get file info
        const file = await FileModel.findById(share.file_id);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        res.status(200).json({
            requiresPassword: !!share.password_hash,
            file: {
                name: file.original_name,
                size: file.size,
                mime_type: file.mime_type,
            },
            expiresAt: share.expires_at,
            downloadsRemaining: share.max_downloads
                ? share.max_downloads - share.download_count
                : null,
        });
    } catch (error) {
        console.error('Get share error:', error);
        res.status(500).json({ error: 'Failed to retrieve share' });
    }
}

export async function validateShare(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const share = await ShareModel.findByToken(token);
        if (!share) {
            res.status(404).json({ error: 'Share link not found' });
            return;
        }

        // Check if password is required
        if (!share.password_hash) {
            res.status(200).json({ valid: true });
            return;
        }

        // Validate password
        if (!password) {
            res.status(400).json({ error: 'Password required' });
            return;
        }

        const isValid = await comparePassword(password, share.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }

        res.status(200).json({ valid: true });
    } catch (error) {
        console.error('Validate share error:', error);
        res.status(500).json({ error: 'Validation failed' });
    }
}

export async function downloadSharedFile(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.params;
        const { password } = req.query;

        const share = await ShareModel.findByToken(token);
        if (!share) {
            res.status(404).json({ error: 'Share link not found' });
            return;
        }

        // Check if expired
        if (ShareModel.isExpired(share)) {
            res.status(410).json({ error: 'Share link has expired' });
            return;
        }

        // Check download limit
        if (ShareModel.hasReachedDownloadLimit(share)) {
            res.status(410).json({ error: 'Download limit reached' });
            return;
        }

        // Validate password if required
        if (share.password_hash) {
            if (!password) {
                res.status(401).json({ error: 'Password required' });
                return;
            }

            const isValid = await comparePassword(password as string, share.password_hash);
            if (!isValid) {
                res.status(401).json({ error: 'Invalid password' });
                return;
            }
        }

        // Get file
        const file = await FileModel.findById(share.file_id);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }


        if (isS3Storage && s3Client) {
            // Download from S3
            try {
                const command = new GetObjectCommand({
                    Bucket: config.aws.s3BucketName,
                    Key: file.storage_path, // storage_path stores the S3 Key
                });

                const response = await s3Client.send(command);

                // Set headers based on S3 response
                res.setHeader('Content-Type', file.mime_type);
                res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);

                if (response.ContentLength) {
                    res.setHeader('Content-Length', response.ContentLength);
                }

                if (response.Body instanceof Readable) {
                    response.Body.pipe(res).on('error', (err) => {
                        console.error('Stream piping error:', err);
                    });
                } else if (response.Body) {
                    (response.Body as any).pipe(res).on('error', (err: any) => {
                        console.error('Stream piping error (any):', err);
                    });
                } else {
                    throw new Error('Empty response body from S3');
                }
            } catch (s3Error) {
                console.error('S3 Download Error:', s3Error);
                if (!res.headersSent) {
                    res.status(404).json({ error: 'File not found in cloud storage' });
                }
            }
        } else {
            // Check if file exists on disk
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
        console.error('Download shared file error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
}

export async function getFileShares(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // Verify file exists and user owns it
        const file = await FileModel.findById(id);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        if (file.user_id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Get all shares for this file
        const shares = await ShareModel.findByFileId(id);

        res.status(200).json({
            shares: shares.map(share => ShareModel.toResponse(share, config.frontendUrl)),
        });
    } catch (error) {
        console.error('Get file shares error:', error);
        res.status(500).json({ error: 'Failed to retrieve shares' });
    }
}

export async function deleteShare(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // Get share
        const share = await ShareModel.findById(id);
        if (!share) {
            res.status(404).json({ error: 'Share not found' });
            return;
        }

        // Verify user owns the share OR is the recipient
        const userEmail = req.user!.email;
        if (share.shared_by !== userId && share.shared_with_email !== userEmail) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete share
        await ShareModel.delete(share.id);

        res.status(200).json({
            message: 'Share deleted successfully',
        });
    } catch (error) {
        console.error('Delete share error:', error);
        res.status(500).json({ error: 'Failed to delete share' });
    }
}

export async function getSharedWithMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userEmail = req.user!.email;

        // Get all shares for this user
        const shares = await ShareModel.findBySharedWithUser(userEmail);

        // Filter out expired shares and format response
        const activeShares = shares
            .filter(share => !ShareModel.isExpired(share))
            .map(share => ({
                id: share.id,
                file: {
                    id: share.file_id,
                    name: share.file_name,
                    size: share.file_size,
                    type: share.file_mime_type,
                },
                sharedBy: {
                    id: share.shared_by_id,
                    name: share.shared_by_name,
                    email: share.shared_by_email,
                },
                shareToken: share.share_token,
                sharedAt: share.created_at,
                expiresAt: share.expires_at,
                permissions: share.permissions || ['view', 'download'],
                isPasswordProtected: !!share.password_hash,
                downloadCount: share.download_count,
                maxDownloads: share.max_downloads,
            }));

        res.status(200).json({
            shares: activeShares,
        });
    } catch (error) {
        console.error('Get shared with me error:', error);
        res.status(500).json({ error: 'Failed to retrieve shared files' });
    }
}

