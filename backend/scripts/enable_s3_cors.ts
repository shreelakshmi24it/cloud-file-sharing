import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import config from '../src/config';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

async function enableCors() {
    console.log(`Enabling CORS for bucket: ${config.aws.s3BucketName}`);

    const command = new PutBucketCorsCommand({
        Bucket: config.aws.s3BucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['GET', 'HEAD'],
                    AllowedOrigins: ['*'], // For production, restrict this to your frontend URL
                    ExposeHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
                    MaxAgeSeconds: 3000,
                },
            ],
        },
    });

    try {
        await s3Client.send(command);
        console.log('✅ S3 CORS configuration updated successfully.');
    } catch (error) {
        console.error('❌ Failed to update S3 CORS:', error);
        process.exit(1);
    }
}

enableCors();
