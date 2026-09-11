const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

let googleAuthEnabled = false;
const LOCAL_GOOGLE_CALLBACK_URL = "http://localhost:5001/api/auth/google/callback";

function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getForwardedOrigin(req) {
  const forwardedHost = req?.get("x-forwarded-host");
  const host = forwardedHost || req?.get("host");
  if (!host) return null;

  const forwardedProto = req?.get("x-forwarded-proto");
  const proto = forwardedProto || req?.protocol || "http";
  const cleanProto = String(proto).split(",")[0].trim();
  const cleanHost = String(host).split(",")[0].trim();
  return `${cleanProto}://${cleanHost}`;
}

function getGoogleCallbackURL(req) {
  const configured = process.env.GOOGLE_CALLBACK_URL || LOCAL_GOOGLE_CALLBACK_URL;
  if (!isLocalUrl(configured)) return configured;

  const forwardedOrigin = getForwardedOrigin(req);
  if (forwardedOrigin && !isLocalUrl(forwardedOrigin)) {
    return `${forwardedOrigin}/api/auth/google/callback`;
  }

  return configured;
}

function getFrontendOrigin(req) {
  const configured =
    String(process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")[0]
      .trim();
  if (!isLocalUrl(configured)) return configured;

  const forwardedOrigin = getForwardedOrigin(req);
  if (forwardedOrigin && !isLocalUrl(forwardedOrigin)) {
    return forwardedOrigin;
  }

  return configured;
}

function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || LOCAL_GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret) {
    googleAuthEnabled = false;
    return false;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email']
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account does not have an email"), null);
          }

          return done(null, {
            email,
            name: profile.displayName?.trim() || null
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  googleAuthEnabled = true;
  return true;
}

function isGoogleAuthEnabled() {
  return googleAuthEnabled;
}

module.exports = {
  passport,
  configurePassport,
  isGoogleAuthEnabled,
  getGoogleCallbackURL,
  getFrontendOrigin
};
