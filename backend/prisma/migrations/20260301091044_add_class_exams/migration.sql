-- AlterTable
ALTER TABLE "exam_assignments" ADD COLUMN     "class_exam_id" TEXT;

-- CreateTable
CREATE TABLE "class_exams" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "available_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "time_limit" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "show_results_immediately" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_exams_class_id_idx" ON "class_exams"("class_id");

-- CreateIndex
CREATE INDEX "class_exams_exam_id_idx" ON "class_exams"("exam_id");

-- CreateIndex
CREATE INDEX "class_exams_teacher_id_idx" ON "class_exams"("teacher_id");

-- CreateIndex
CREATE INDEX "class_exams_is_published_idx" ON "class_exams"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "class_exams_class_id_exam_id_key" ON "class_exams"("class_id", "exam_id");

-- CreateIndex
CREATE INDEX "exam_assignments_class_exam_id_idx" ON "exam_assignments"("class_exam_id");

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_class_exam_id_fkey" FOREIGN KEY ("class_exam_id") REFERENCES "class_exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_exams" ADD CONSTRAINT "class_exams_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_exams" ADD CONSTRAINT "class_exams_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_exams" ADD CONSTRAINT "class_exams_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
