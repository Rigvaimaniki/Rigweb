CREATE TYPE "PaymentAttemptStatus" AS ENUM ('created', 'paid', 'failed', 'cancelled');

CREATE TABLE "CoursePaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "billingName" TEXT,
    "billingPhone" TEXT,
    "courseName" TEXT,
    "amountPaise" INTEGER,
    "currency" TEXT,
    "pricing" JSONB,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'created',
    "failureStage" TEXT,
    "failureReason" TEXT,
    "failureRaw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "CoursePaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoursePaymentAttempt_orderId_key" ON "CoursePaymentAttempt"("orderId");
CREATE INDEX "CoursePaymentAttempt_userId_idx" ON "CoursePaymentAttempt"("userId");
CREATE INDEX "CoursePaymentAttempt_status_idx" ON "CoursePaymentAttempt"("status");
CREATE INDEX "CoursePaymentAttempt_createdAt_idx" ON "CoursePaymentAttempt"("createdAt");

ALTER TABLE "CoursePaymentAttempt" ADD CONSTRAINT "CoursePaymentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

