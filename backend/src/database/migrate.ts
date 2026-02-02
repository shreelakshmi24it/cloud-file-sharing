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
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.disconnect();
        throw error; // Let the calling process handle the error
    }
}

runMigrations();
