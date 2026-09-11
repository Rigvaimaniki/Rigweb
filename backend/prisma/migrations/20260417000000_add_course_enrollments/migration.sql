CREATE TYPE "CourseEnrollmentStatus" AS ENUM ('created', 'paid');

CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "billingName" TEXT,
    "billingPhone" TEXT,
    "courseName" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pricing" JSONB,
    "status" "CourseEnrollmentStatus" NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseEnrollment_orderId_key" ON "CourseEnrollment"("orderId");
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");
CREATE INDEX "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");
CREATE INDEX "CourseEnrollment_createdAt_idx" ON "CourseEnrollment"("createdAt");

ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

