import fs from 'fs';
import path from 'path';
import db from './connection';

async function runSettingsMigration() {
    try {
        console.log('🔄 Running settings migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_settings_fields.sql');
        const migration = fs.readFileSync(migrationPath, 'utf-8');

        // Execute the migration
        await db.query(migration);

        console.log('✅ Settings migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runSettingsMigration();
