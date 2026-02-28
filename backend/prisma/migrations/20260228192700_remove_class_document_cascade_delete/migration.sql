-- DropForeignKey
ALTER TABLE "class_documents" DROP CONSTRAINT "class_documents_class_id_fkey";

-- DropForeignKey
ALTER TABLE "class_documents" DROP CONSTRAINT "class_documents_document_id_fkey";

-- AddForeignKey
ALTER TABLE "class_documents" ADD CONSTRAINT "class_documents_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "class_documents" ADD CONSTRAINT "class_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
