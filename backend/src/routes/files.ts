import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
    uploadFile,
    getFiles,
    getFileById,
    downloadFile,
    deleteFile,
    moveFile,
} from '../controllers/fileController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File routes
router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.patch('/:id/move', moveFile);
router.delete('/:id', deleteFile);

export default router;
