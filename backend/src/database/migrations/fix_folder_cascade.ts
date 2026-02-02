import db from '../connection';

async function runMigration() {
    try {
        console.log('🔄 Running folder cascade delete migration...');

        // Drop the existing constraint
        await db.query('ALTER TABLE files DROP CONSTRAINT IF EXISTS files_folder_id_fkey');
        console.log('✓ Dropped old constraint');

        // Add the new constraint with CASCADE DELETE
        await db.query(`
            ALTER TABLE files 
            ADD CONSTRAINT files_folder_id_fkey 
            FOREIGN KEY (folder_id) 
            REFERENCES folders(id) 
            ON DELETE CASCADE
        `);
        console.log('✓ Added new constraint with CASCADE DELETE');

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
