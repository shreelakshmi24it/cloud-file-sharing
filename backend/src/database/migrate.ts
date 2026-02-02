import fs from 'fs';
import path from 'path';
import db from './connection';

async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Execute the schema
        await db.query(schema);

        console.log('✅ Database migrations completed successfully');

        // Close the database connection
        await db.disconnect();

        // Exit successfully
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.disconnect();
        // Exit with error code
        process.exit(1);
    }
}

// Run migrations and handle any unhandled rejections
runMigrations().catch((error) => {
    console.error('Unhandled error during migration:', error);
    process.exit(1);
});
