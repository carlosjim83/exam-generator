-- Add HNSW index for vector similarity search on document_chunks
-- HNSW (Hierarchical Navigable Small World) is more efficient than IVFFlat for similarity search
-- Using cosine distance operator (<=>), which is ideal for normalized embeddings
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);
