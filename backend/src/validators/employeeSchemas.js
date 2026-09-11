const { z } = require("zod");

const attendanceActionSchema = z.object({
  action: z.enum(["check_in", "check_out"]),
  officeLocationId: z.string().uuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

const documentUploadSchema = z.object({
  category: z.string().trim().min(2).max(80)
});

const leaveRequestSchema = z.object({
  leaveType: z.enum(["Casual Leave", "Sick Leave", "Emergency Leave", "Work From Home", "Paid Leave", "Unpaid Leave"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().max(1000).optional().nullable()
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be on or after start date"
});

module.exports = {
  attendanceActionSchema,
  documentUploadSchema,
  leaveRequestSchema
};
