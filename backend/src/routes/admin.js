const router = require("express").Router();
const {
  getUsers,
  updateUserRole,
  updateUserVerification,
  deleteUser,
  getLoginEvents,
  getEmployeeProfiles,
  createEmployeeProfile,
  updateEmployeeProfile,
  deleteEmployeeProfile,
  getEmployeeSystem,
  createOfficeLocation,
  updateOfficeLocation,
  deleteOfficeLocation,
  createNamedSetting,
  updateNamedSetting,
  deleteNamedSetting,
  createShift,
  updateShift,
  deleteShift,
  createManualAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  updateLeaveStatus,
  getAttendanceExport,
  createCourse,
  getCourses,
  updateCourse,
  duplicateCourse,
  deleteCourse,
  seedDefaultCourses,
  getEnrollments,
  getEnrollmentDetail,
  updateEnrollment,
  resendEnrollmentInvoice,
  updatePaymentReceived,
  exportEnrollments,
  getPaymentAttempts,
  exportPaymentAttempts,
  uploadCourseImage
} = require("../controllers/adminController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  userIdParamSchema,
  updateRoleSchema,
  updateUserVerificationSchema,
  courseIdParamSchema,
  employeeProfileIdParamSchema,
  employeeProfileSchema,
  updateEmployeeProfileSchema,
  createCourseSchema,
  updateCourseSchema,
  enrollmentIdParamSchema,
  updatePaymentReceivedSchema,
  updateEnrollmentSchema,
  officeLocationSchema,
  namedSettingSchema,
  shiftSchema,
  attendanceIdParamSchema,
  leaveIdParamSchema,
  adminAttendanceSchema,
  updateAttendanceSchema,
  updateLeaveStatusSchema
} = require("../validators/adminSchemas");
const { asyncHandler } = require("../utils/asyncHandler");
const path = require("path");

router.use(requireAuth, requireAdmin);

router.get("/users", asyncHandler(getUsers));
router.patch(
  "/users/:id/role",
  validateParams(userIdParamSchema),
  validateBody(updateRoleSchema),
  asyncHandler(updateUserRole)
);
router.patch(
  "/users/:id/verification",
  validateParams(userIdParamSchema),
  validateBody(updateUserVerificationSchema),
  asyncHandler(updateUserVerification)
);
router.delete("/users/:id", validateParams(userIdParamSchema), asyncHandler(deleteUser));

router.get("/logins", asyncHandler(getLoginEvents));

router.get("/employee-system", asyncHandler(getEmployeeSystem));
router.get("/employee-system/export-attendance", asyncHandler(getAttendanceExport));

router.get("/employees", asyncHandler(getEmployeeProfiles));
router.post("/employees", validateBody(employeeProfileSchema), asyncHandler(createEmployeeProfile));
router.patch(
  "/employees/:id",
  validateParams(employeeProfileIdParamSchema),
  validateBody(updateEmployeeProfileSchema),
  asyncHandler(updateEmployeeProfile)
);
router.delete(
  "/employees/:id",
  validateParams(employeeProfileIdParamSchema),
  asyncHandler(deleteEmployeeProfile)
);

router.post("/office-locations", validateBody(officeLocationSchema), asyncHandler(createOfficeLocation));
router.patch(
  "/office-locations/:id",
  validateParams(employeeProfileIdParamSchema),
  validateBody(officeLocationSchema.partial()),
  asyncHandler(updateOfficeLocation)
);
router.delete("/office-locations/:id", validateParams(employeeProfileIdParamSchema), asyncHandler(deleteOfficeLocation));

router.post("/settings/:kind", validateBody(namedSettingSchema), asyncHandler(createNamedSetting));
router.patch(
  "/settings/:kind/:id",
  validateParams(employeeProfileIdParamSchema),
  validateBody(namedSettingSchema.partial()),
  asyncHandler(updateNamedSetting)
);
router.delete("/settings/:kind/:id", validateParams(employeeProfileIdParamSchema), asyncHandler(deleteNamedSetting));

router.post("/shifts", validateBody(shiftSchema), asyncHandler(createShift));
router.patch(
  "/shifts/:id",
  validateParams(employeeProfileIdParamSchema),
  validateBody(shiftSchema.partial()),
  asyncHandler(updateShift)
);
router.delete("/shifts/:id", validateParams(employeeProfileIdParamSchema), asyncHandler(deleteShift));

router.post("/attendance", validateBody(adminAttendanceSchema), asyncHandler(createManualAttendance));
router.patch(
  "/attendance/:id",
  validateParams(attendanceIdParamSchema),
  validateBody(updateAttendanceSchema),
  asyncHandler(updateAttendanceRecord)
);
router.delete("/attendance/:id", validateParams(attendanceIdParamSchema), asyncHandler(deleteAttendanceRecord));

router.patch(
  "/leaves/:id",
  validateParams(leaveIdParamSchema),
  validateBody(updateLeaveStatusSchema),
  asyncHandler(updateLeaveStatus)
);

router.post("/courses", validateBody(createCourseSchema), asyncHandler(createCourse));
router.get("/courses", asyncHandler(getCourses));
router.post("/courses/seed-defaults", asyncHandler(seedDefaultCourses));
const multer = require("multer");
const upload = multer({ dest: path.join(process.cwd(), "tmp_uploads") });
router.post("/uploads", upload.single("file"), asyncHandler(uploadCourseImage));
router.patch(
  "/courses/:id",
  validateParams(courseIdParamSchema),
  validateBody(updateCourseSchema),
  asyncHandler(updateCourse)
);
router.post(
  "/courses/:id/duplicate",
  validateParams(courseIdParamSchema),
  asyncHandler(duplicateCourse)
);
router.delete("/courses/:id", validateParams(courseIdParamSchema), asyncHandler(deleteCourse));

router.get("/enrollments", asyncHandler(getEnrollments));
router.get("/enrollments/:id", validateParams(enrollmentIdParamSchema), asyncHandler(getEnrollmentDetail));
router.patch(
  "/enrollments/:id",
  validateParams(enrollmentIdParamSchema),
  validateBody(updateEnrollmentSchema),
  asyncHandler(updateEnrollment)
);
router.post(
  "/enrollments/:id/resend-invoice",
  validateParams(enrollmentIdParamSchema),
  asyncHandler(resendEnrollmentInvoice)
);
router.patch(
  "/enrollments/:id/payment-received",
  validateParams(enrollmentIdParamSchema),
  validateBody(updatePaymentReceivedSchema),
  asyncHandler(updatePaymentReceived)
);
router.get("/enrollments/export", asyncHandler(exportEnrollments));

router.get("/payment-attempts", asyncHandler(getPaymentAttempts));
router.get("/payment-attempts/export", asyncHandler(exportPaymentAttempts));

module.exports = router;
