-- AlterEnum
ALTER TYPE "CourseCategory" ADD VALUE 'advance';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CourseEnrollment" ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "CoursePaymentAttempt" ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileCountry" TEXT NOT NULL DEFAULT 'IN',
ADD COLUMN     "mobilePhone" TEXT;

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");

-- CreateIndex
CREATE INDEX "Course_sortOrder_idx" ON "Course"("sortOrder");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CoursePaymentAttempt_courseId_idx" ON "CoursePaymentAttempt"("courseId");

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePaymentAttempt" ADD CONSTRAINT "CoursePaymentAttempt_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
