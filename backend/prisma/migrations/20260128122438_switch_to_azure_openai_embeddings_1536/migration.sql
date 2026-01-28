-- Switch from Gemini embeddings (3072 dims) to Azure OpenAI embeddings (1536 dims)

-- Step 1: Clear existing chunks (embedding dimensions are incompatible)
TRUNCATE TABLE document_chunks CASCADE;

-- Step 2: Update embedding column to new dimension
ALTER TABLE document_chunks 
ALTER COLUMN embedding TYPE vector(1536);

-- Step 3: Reset documents to PENDING for reprocessing with new embedding model
UPDATE documents 
SET status = 'PENDING', 
    processed_at = NULL,
    page_count = NULL,
    word_count = NULL,
    error_message = NULL,
    updated_at = NOW()
WHERE status IN ('COMPLETED', 'FAILED', 'PROCESSING');

-- Step 4: Add comment for documentation
COMMENT ON COLUMN document_chunks.embedding IS 'Azure OpenAI text-embedding-ada-002 (1536 dimensions)';
