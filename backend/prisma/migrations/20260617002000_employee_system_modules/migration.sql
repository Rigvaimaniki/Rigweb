ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE "EmployeeProfile"
ADD COLUMN IF NOT EXISTS "officeLocationId" TEXT,
ADD COLUMN IF NOT EXISTS "shiftId" TEXT;

ALTER TABLE "AttendanceRecord"
ADD COLUMN IF NOT EXISTS "officeLocationId" TEXT,
ADD COLUMN IF NOT EXISTS "lateMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "earlyDepartureMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalWorkingMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "remarks" TEXT;

ALTER TABLE "AdminAuditLog"
ADD COLUMN IF NOT EXISTS "ip" TEXT,
ADD COLUMN IF NOT EXISTS "oldValue" JSONB,
ADD COLUMN IF NOT EXISTS "newValue" JSONB;

CREATE TABLE IF NOT EXISTS "OfficeLocation" (
    "id" TEXT NOT NULL,
    "officeName" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "allowedRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OfficeLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Shift" (
    "id" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "requiredWorkingMinutes" INTEGER,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 0,
    "breakDurationMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeThresholdMinutes" INTEGER NOT NULL DEFAULT 0,
    "weeklyOffDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShiftAssignmentHistory" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "previousShift" TEXT,
    "newShift" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftAssignmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Designation_name_key" ON "Designation"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Shift_shiftName_key" ON "Shift"("shiftName");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentCategory_name_key" ON "DocumentCategory"("name");
CREATE INDEX IF NOT EXISTS "OfficeLocation_isActive_idx" ON "OfficeLocation"("isActive");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_officeLocationId_idx" ON "EmployeeProfile"("officeLocationId");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_shiftId_idx" ON "EmployeeProfile"("shiftId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_officeLocationId_idx" ON "AttendanceRecord"("officeLocationId");
CREATE INDEX IF NOT EXISTS "ShiftAssignmentHistory_employeeProfileId_idx" ON "ShiftAssignmentHistory"("employeeProfileId");
CREATE INDEX IF NOT EXISTS "ShiftAssignmentHistory_effectiveDate_idx" ON "ShiftAssignmentHistory"("effectiveDate");
CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeProfileId_idx" ON "LeaveRequest"("employeeProfileId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

ALTER TABLE "EmployeeProfile"
ADD CONSTRAINT "EmployeeProfile_officeLocationId_fkey"
FOREIGN KEY ("officeLocationId") REFERENCES "OfficeLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmployeeProfile"
ADD CONSTRAINT "EmployeeProfile_shiftId_fkey"
FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_officeLocationId_fkey"
FOREIGN KEY ("officeLocationId") REFERENCES "OfficeLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShiftAssignmentHistory"
ADD CONSTRAINT "ShiftAssignmentHistory_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
