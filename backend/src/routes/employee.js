const path = require("path");
const multer = require("multer");
const router = require("express").Router();
const {
  getMyEmployeeProfile,
  markMyAttendance,
  applyForLeave,
  uploadMyDocument
} = require("../controllers/employeeController");
const { requireAuth, requireVerifiedEmployeeAccess } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const {
  attendanceActionSchema,
  documentUploadSchema,
  leaveRequestSchema
} = require("../validators/employeeSchemas");
const { asyncHandler } = require("../utils/asyncHandler");

const upload = multer({
  dest: path.join(process.cwd(), "tmp_uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(requireAuth, requireVerifiedEmployeeAccess);

router.get("/me", asyncHandler(getMyEmployeeProfile));
router.post("/attendance", validateBody(attendanceActionSchema), asyncHandler(markMyAttendance));
router.post("/leaves", validateBody(leaveRequestSchema), asyncHandler(applyForLeave));
router.post(
  "/documents",
  upload.single("file"),
  validateBody(documentUploadSchema),
  asyncHandler(uploadMyDocument)
);

module.exports = router;
