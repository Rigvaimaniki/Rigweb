const { z } = require("zod");

const userIdParamSchema = z.object({
  id: z.string().uuid()
});

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin", "super_admin"])
});

const updateUserVerificationSchema = z.object({
  verified: z.boolean()
});

const courseIdParamSchema = z.object({
  id: z.string().uuid()
});

const employeeProfileIdParamSchema = z.object({
  id: z.string().uuid()
});

const employeeProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  mobileNumber: z.string().trim().min(6).max(32).optional().nullable(),
  alternateContactNumber: z.string().trim().min(6).max(32).optional().nullable(),
  residentialAddress: z.string().trim().min(2).max(500).optional().nullable(),
  emergencyContactPerson: z.string().trim().min(2).max(120).optional().nullable(),
  emergencyContactNumber: z.string().trim().min(6).max(32).optional().nullable(),
  profilePhotographUrl: z.string().trim().max(500).optional().nullable(),
  panNumber: z.string().trim().max(32).optional().nullable(),
  aadhaarNumber: z.string().trim().max(32).optional().nullable(),
  accountNumber: z.string().trim().max(64).optional().nullable(),
  ifscCode: z.string().trim().max(32).optional().nullable(),
  bankName: z.string().trim().max(120).optional().nullable(),
  branchName: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  designation: z.string().trim().max(120).optional().nullable(),
  reportingManager: z.string().trim().max(160).optional().nullable(),
  assignedShift: z.string().trim().max(120).optional().nullable(),
  officeLocationId: z.string().uuid().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable(),
  employmentType: z.string().trim().min(2).max(80),
  employmentStatus: z.string().trim().min(2).max(80).optional(),
  dateOfJoining: z.coerce.date().optional().nullable(),
  dateOfRelieving: z.coerce.date().optional().nullable(),
  collegeName: z.string().trim().max(180).optional().nullable(),
  universityName: z.string().trim().max(180).optional().nullable(),
  studentId: z.string().trim().max(80).optional().nullable(),
  nocUrl: z.string().trim().max(500).optional().nullable(),
  internshipStartDate: z.coerce.date().optional().nullable(),
  internshipEndDate: z.coerce.date().optional().nullable(),
  internshipDuration: z.string().trim().max(80).optional().nullable(),
  stipendAmount: z.coerce.number().min(0).optional().nullable(),
  mentorAssigned: z.string().trim().max(160).optional().nullable(),
  internshipCertificateStatus: z.string().trim().max(80).optional().nullable()
});

const updateEmployeeProfileSchema = employeeProfileSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

const officeLocationSchema = z.object({
  officeName: z.string().trim().min(2).max(120),
  officeAddress: z.string().trim().min(2).max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  allowedRadiusMeters: z.coerce.number().int().min(10).max(10000),
  isActive: z.coerce.boolean().optional()
});

const namedSettingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  groupName: z.string().trim().max(120).optional().nullable(),
  isActive: z.coerce.boolean().optional()
});

const shiftSchema = z.object({
  shiftName: z.string().trim().min(2).max(120),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  requiredWorkingMinutes: z.coerce.number().int().min(1).max(1440).optional().nullable(),
  gracePeriodMinutes: z.coerce.number().int().min(0).max(240).optional(),
  breakDurationMinutes: z.coerce.number().int().min(0).max(480).optional(),
  overtimeThresholdMinutes: z.coerce.number().int().min(0).max(480).optional(),
  weeklyOffDays: z.array(z.string().trim().min(2).max(20)).max(7).optional(),
  isFlexible: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional()
});

const attendanceIdParamSchema = z.object({
  id: z.string().uuid()
});

const leaveIdParamSchema = z.object({
  id: z.string().uuid()
});

const adminAttendanceSchema = z.object({
  employeeProfileId: z.string().uuid(),
  officeLocationId: z.string().uuid().optional().nullable(),
  attendanceDate: z.coerce.date(),
  checkInAt: z.coerce.date().optional().nullable(),
  checkOutAt: z.coerce.date().optional().nullable(),
  status: z.string().trim().min(2).max(80).optional(),
  remarks: z.string().trim().max(1000).optional().nullable(),
  reason: z.string().trim().min(2).max(1000)
});

const updateAttendanceSchema = adminAttendanceSchema.partial().extend({
  reason: z.string().trim().min(2).max(1000)
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected", "Cancelled"]),
  reviewRemarks: z.string().trim().max(1000).optional().nullable()
});

const createCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(2000),
  price: z.coerce.number().min(0),
  duration: z.string().trim().min(2).max(80),
  category: z.enum(["basic", "moderate", "advance"]),
  features: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  images: z.array(z.string().trim().min(1)).max(20).optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional()
});

const updateCourseSchema = createCourseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

const enrollmentIdParamSchema = z.object({
  id: z.string().uuid()
});

const updatePaymentReceivedSchema = z.object({
  paymentReceived: z.boolean()
});

const updateEnrollmentSchema = z
  .object({
    billingName: z.string().trim().min(2).max(120).optional().nullable(),
    billingPhone: z.string().trim().min(6).max(32).optional().nullable(),
    firstName: z.string().trim().min(1).max(60).optional().nullable(),
    lastName: z.string().trim().min(1).max(60).optional().nullable(),
    gender: z.string().trim().min(1).max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    dateOfBirth: z.coerce.date().optional().nullable(),
    city: z.string().trim().min(1).max(80).optional().nullable(),
    state: z.string().trim().min(1).max(80).optional().nullable(),
    preferredBatch: z.string().trim().min(1).max(40).optional().nullable(),
    experienceLevel: z.string().trim().min(1).max(40).optional().nullable(),
    profession: z.string().trim().min(1).max(80).optional().nullable(),
    college: z.string().trim().min(1).max(120).optional().nullable(),
    agreedToFollowUp: z.boolean().optional(),
    status: z.enum(["created", "paid"]).optional(),
    paymentReceived: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

module.exports = {
  userIdParamSchema,
  updateRoleSchema,
  updateUserVerificationSchema,
  courseIdParamSchema,
  employeeProfileIdParamSchema,
  employeeProfileSchema,
  updateEmployeeProfileSchema,
  officeLocationSchema,
  namedSettingSchema,
  shiftSchema,
  attendanceIdParamSchema,
  leaveIdParamSchema,
  adminAttendanceSchema,
  updateAttendanceSchema,
  updateLeaveStatusSchema,
  createCourseSchema,
  updateCourseSchema,
  enrollmentIdParamSchema,
  updatePaymentReceivedSchema,
  updateEnrollmentSchema
};
