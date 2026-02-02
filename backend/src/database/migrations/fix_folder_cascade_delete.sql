-- Migration to fix folder deletion behavior
-- This changes the folder_id foreign key constraint to CASCADE DELETE
-- so that files are deleted when their parent folder is deleted

-- Drop the existing constraint
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_folder_id_fkey;

-- Add the new constraint with CASCADE DELETE
ALTER TABLE files 
ADD CONSTRAINT files_folder_id_fkey 
FOREIGN KEY (folder_id) 
REFERENCES folders(id) 
ON DELETE CASCADE;
