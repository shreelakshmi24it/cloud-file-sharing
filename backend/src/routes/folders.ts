import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createFolder,
    getFolders,
    getFolderById,
    getFolderContents,
    getFolderPath,
    updateFolder,
    deleteFolder,
} from '../controllers/folderController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Folder routes
router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id', getFolderById);
router.get('/:id/contents', getFolderContents);
router.get('/:id/path', getFolderPath);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
