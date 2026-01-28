-- DropIndex
DROP INDEX "document_chunks_embedding_idx";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
