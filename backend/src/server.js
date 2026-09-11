require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const health = require("./routes/health");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const courses = require("./routes/courses");
const payments = require("./routes/payments");
const employee = require("./routes/employee");
const {
  passport,
  configurePassport,
  isGoogleAuthEnabled,
  getGoogleCallbackURL,
  getFrontendOrigin
} = require("./config/passport");
const { googleCallback, googleFailureRedirect } = require("./controllers/authController");
const { asyncHandler } = require("./utils/asyncHandler");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));
configurePassport();
app.use(passport.initialize());

app.use(
  cors({
    origin: (() => {
      const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || "http://localhost:5173";
      const origins = String(raw)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      return origins.length <= 1 ? origins[0] : origins;
    })(),
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200
  })
);

app.use("/api/health", health);
app.use("/api/auth", auth);
app.use("/api/admin", admin);
app.use("/api/employee", employee);
app.use("/api/courses", courses);
app.use("/api/payments", payments);

// Legacy/compat route:
// Some Google OAuth setups use `/access` as the redirect URI. Handle it as an alias of the
// real callback route and then redirect to the frontend access page.
app.get(
  "/access",
  (req, res, next) => {
    const frontendBase = getFrontendOrigin(req);

    // If this isn't an OAuth callback request, avoid returning JSON 404s and instead send the
    // user to the frontend route (as long as it won't cause a redirect loop).
    const currentOrigin = `${req.protocol}://${req.get("host")}`;
    const hasOAuthQuery =
      typeof req.query?.code === "string" ||
      typeof req.query?.state === "string" ||
      typeof req.query?.error === "string";

    if (!hasOAuthQuery) {
      if (frontendBase && frontendBase !== currentOrigin) {
        return res.redirect(`${frontendBase}/access`);
      }
      return res.status(404).json({ error: "Route not found" });
    }

    if (typeof req.query?.error === "string") {
      return googleFailureRedirect(req, res);
    }

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

// Compatibility aliases for existing/older frontend integrations.
app.use("/", payments);
app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => {
  console.log(`API running on http://localhost:${process.env.PORT || 5000}`);
});
