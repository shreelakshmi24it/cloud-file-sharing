import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import config from '../config';

// Ensure uploads directory exists (for local storage)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// S3 Client setup
let s3Client: S3Client | null = null;
if (config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3BucketName) {
    s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
    });
}

// Configure storage
const storage = s3Client
    ? multerS3({
        s3: s3Client,
        bucket: config.aws.s3BucketName,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (_req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (_req, file, cb) => {
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    })
    : multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (_req, file, cb) => {
            // Generate unique filename
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    });

// File filter
const fileFilter = (_req: any, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept all files for now
    // Can add restrictions later
    cb(null, true);
};

// Create multer instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
});

export const uploadsDirectory = uploadsDir;
export const isS3Storage = !!s3Client;
export { s3Client };
