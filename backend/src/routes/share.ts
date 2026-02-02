import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createShare,
    getShare,
    validateShare,
    downloadSharedFile,
    getFileShares,
    deleteShare,
    getSharedWithMe,
} from '../controllers/shareController';

const router = Router();

// Protected routes (authentication required) - MUST come before wildcard routes
router.post('/', authenticate, createShare);
router.get('/shared-with-me', authenticate, getSharedWithMe);
router.get('/file/:id/shares', authenticate, getFileShares);
router.delete('/:id', authenticate, deleteShare);

// Public routes (no authentication required) - wildcard routes come last
router.get('/:token', getShare);
router.post('/:token/validate', validateShare);
router.get('/:token/download', downloadSharedFile);

export default router;
