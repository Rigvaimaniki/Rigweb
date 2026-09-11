const router = require("express").Router();
const { listPublicCourses } = require("../controllers/courseController");
const { asyncHandler } = require("../utils/asyncHandler");

router.get("/", asyncHandler(listPublicCourses));

module.exports = router;

