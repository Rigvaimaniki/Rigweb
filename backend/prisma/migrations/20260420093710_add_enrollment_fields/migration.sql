-- AlterTable
ALTER TABLE "CourseEnrollment" ADD COLUMN     "agreedToFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "college" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "paymentReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredBatch" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseName_idx" ON "CourseEnrollment"("courseName");
