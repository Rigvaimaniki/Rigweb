CREATE TABLE IF NOT EXISTS "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "alternateContactNumber" TEXT,
    "residentialAddress" TEXT,
    "emergencyContactPerson" TEXT,
    "emergencyContactNumber" TEXT,
    "profilePhotographUrl" TEXT,
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "reportingManager" TEXT,
    "assignedShift" TEXT,
    "employmentType" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'Active',
    "dateOfJoining" TIMESTAMP(3),
    "dateOfRelieving" TIMESTAMP(3),
    "collegeName" TEXT,
    "universityName" TEXT,
    "studentId" TEXT,
    "nocUrl" TEXT,
    "internshipStartDate" TIMESTAMP(3),
    "internshipEndDate" TIMESTAMP(3),
    "internshipDuration" TEXT,
    "stipendAmount" DOUBLE PRECISION,
    "mentorAssigned" TEXT,
    "internshipCertificateStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "checkInLatitude" DOUBLE PRECISION,
    "checkInLongitude" DOUBLE PRECISION,
    "checkOutLatitude" DOUBLE PRECISION,
    "checkOutLongitude" DOUBLE PRECISION,
    "checkInIp" TEXT,
    "checkOutIp" TEXT,
    "checkInDevice" TEXT,
    "checkOutDevice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeLifecycleHistory" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "previousRole" TEXT,
    "newRole" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeLifecycleHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeProfile_employeeId_key" ON "EmployeeProfile"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeProfile_email_key" ON "EmployeeProfile"("email");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_email_idx" ON "EmployeeProfile"("email");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_department_idx" ON "EmployeeProfile"("department");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_employmentType_idx" ON "EmployeeProfile"("employmentType");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_employmentStatus_idx" ON "EmployeeProfile"("employmentStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_employeeProfileId_attendanceDate_key" ON "AttendanceRecord"("employeeProfileId", "attendanceDate");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_attendanceDate_idx" ON "AttendanceRecord"("attendanceDate");
CREATE INDEX IF NOT EXISTS "EmployeeDocument_employeeProfileId_idx" ON "EmployeeDocument"("employeeProfileId");
CREATE INDEX IF NOT EXISTS "EmployeeDocument_category_idx" ON "EmployeeDocument"("category");
CREATE INDEX IF NOT EXISTS "EmployeeLifecycleHistory_employeeProfileId_idx" ON "EmployeeLifecycleHistory"("employeeProfileId");
CREATE INDEX IF NOT EXISTS "EmployeeLifecycleHistory_effectiveDate_idx" ON "EmployeeLifecycleHistory"("effectiveDate");

ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeDocument"
ADD CONSTRAINT "EmployeeDocument_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeLifecycleHistory"
ADD CONSTRAINT "EmployeeLifecycleHistory_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
