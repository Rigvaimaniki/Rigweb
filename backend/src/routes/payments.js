const router = require("express").Router();

const { requireAuth } = require("../middleware/auth");
const {
  createOrder,
  recordPaymentAttemptFailure,
  verifyPayment,
  getPurchaseStatus,
  enrollStudent
} = require("../controllers/paymentController");
const { asyncHandler } = require("../utils/asyncHandler");

router.post("/create-order", requireAuth, asyncHandler(createOrder));
router.post("/enroll", requireAuth, asyncHandler(enrollStudent));
router.post("/attempt-failure", requireAuth, asyncHandler(recordPaymentAttemptFailure));
router.post("/verify-payment", requireAuth, asyncHandler(verifyPayment));

// Optional helper for frontend gating/debugging.
router.get("/purchase/:orderId", requireAuth, asyncHandler(getPurchaseStatus));

module.exports = router;
