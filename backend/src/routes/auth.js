const router = require("express").Router();
const {
  signup,
  login,
  logout,
  refresh,
  me,
  googleCallback,
  googlePending,
  googleRegister,
  googleFailureRedirect
} = require("../controllers/authController");
const { asyncHandler } = require("../utils/asyncHandler");
const { validateBody } = require("../middleware/validate");
const { googleRegisterSchema } = require("../validators/authSchemas");
const { authLimiter } = require("../middleware/rateLimiters");
const { passport, isGoogleAuthEnabled, getGoogleCallbackURL } = require("../config/passport");

router.use(authLimiter);

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/refresh", asyncHandler(refresh));
router.get("/me", asyncHandler(me));

// Browser redirect entrypoint for OAuth.
router.get("/google", (req, res, next) => {
  if (!isGoogleAuthEnabled()) {
    return res.status(503).json({ error: "Google auth is not configured" });
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    callbackURL: getGoogleCallbackURL(req),
    prompt: "select_account"
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleAuthEnabled()) {
      return res.status(503).json({ error: "Google auth is not configured" });
    }

    return passport.authenticate("google", {
      session: false,
      callbackURL: getGoogleCallbackURL(req),
      failureRedirect: "/api/auth/google/failure"
    })(req, res, next);
  },
  asyncHandler(googleCallback)
);

router.get("/google/pending", asyncHandler(googlePending));
router.post(
  "/google/register",
  validateBody(googleRegisterSchema),
  asyncHandler(googleRegister)
);

router.get("/google/failure", googleFailureRedirect);

module.exports = router;
