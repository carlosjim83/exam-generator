-- AlterTable
ALTER TABLE "users" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light';
