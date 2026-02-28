-- CreateTable
CREATE TABLE "class_documents" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_documents_class_id_idx" ON "class_documents"("class_id");

-- CreateIndex
CREATE INDEX "class_documents_document_id_idx" ON "class_documents"("document_id");

-- CreateIndex
CREATE INDEX "class_documents_class_id_is_visible_idx" ON "class_documents"("class_id", "is_visible");

-- CreateIndex
CREATE UNIQUE INDEX "class_documents_class_id_document_id_key" ON "class_documents"("class_id", "document_id");

-- AddForeignKey
ALTER TABLE "class_documents" ADD CONSTRAINT "class_documents_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_documents" ADD CONSTRAINT "class_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
