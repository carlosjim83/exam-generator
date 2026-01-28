-- AlterTable: Change embedding vector dimension from 768 to 3072
-- This is necessary because Google's gemini-embedding-001 model now returns 3072 dimensions

-- Step 1: Drop existing chunks (since we can't convert dimensions)
TRUNCATE TABLE document_chunks CASCADE;

-- Step 2: Alter the column type
ALTER TABLE document_chunks 
ALTER COLUMN embedding TYPE vector(3072);

-- Step 3: Update any documents that were in COMPLETED status back to PENDING
-- so they can be reprocessed with the new dimension
UPDATE documents 
SET status = 'PENDING', 
    processed_at = NULL,
    page_count = NULL,
    word_count = NULL,
    error_message = NULL
WHERE status = 'COMPLETED';
