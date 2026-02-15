-- CreateEnum
CREATE TYPE "ExamAssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- CreateTable
CREATE TABLE "exam_assignments" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "status" "ExamAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_assignments_student_id_idx" ON "exam_assignments"("student_id");

-- CreateIndex
CREATE INDEX "exam_assignments_teacher_id_idx" ON "exam_assignments"("teacher_id");

-- CreateIndex
CREATE INDEX "exam_assignments_status_idx" ON "exam_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_assignments_exam_id_student_id_key" ON "exam_assignments"("exam_id", "student_id");

-- CreateIndex
CREATE INDEX "student_answers_assignment_id_idx" ON "student_answers"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_assignment_id_question_id_key" ON "student_answers"("assignment_id", "question_id");

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "exam_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
