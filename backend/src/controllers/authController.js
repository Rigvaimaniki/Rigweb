const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const {
  signAccessToken,
  signRefreshToken,
  signPendingGoogleRegistrationToken,
  verifyPendingGoogleRegistrationToken
} = require("../utils/tokens");
const {
  clearAuthCookies,
  setAuthCookies,
  setGooglePendingCookie,
  clearGooglePendingCookie
} = require("../utils/cookies");
const { getFrontendOrigin } = require("../config/passport");
const { createHttpError } = require("../utils/errors");

function normalizeRegistrationMobile(mobileCountry, mobile) {
  const country = String(mobileCountry || "IN").toUpperCase();
  const raw = String(mobile || "").trim();

  if (country === "IN") {
    const digits = raw.replace(/\D/g, "");
    let local = digits;
    if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
    if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
    if (!/^\d{10}$/.test(local)) return { country: "IN", phone: null };
    return { country: "IN", phone: `+91${local}` };
  }

  const normalized = raw.replace(/\s+/g, "");
  if (!/^\+[1-9]\d{6,14}$/.test(normalized)) return { country: "INTL", phone: null };
  return { country: "INTL", phone: normalized };
}

const FRONTEND_REDIRECT_SUCCESS = process.env.AUTH_SUCCESS_REDIRECT || "/access";
const FRONTEND_REDIRECT_FAILURE = process.env.AUTH_FAILURE_REDIRECT || "/?auth=failed";
const FRONTEND_REDIRECT_REGISTER = process.env.AUTH_REGISTER_REDIRECT || "/register";

async function issueSession(res, user, requestContext = {}) {
  // Rotate refresh token on every login-like event for better session security.
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const refreshHash = await bcrypt.hash(refreshToken, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshHash, lastLoginAt: new Date() }
  });

  if (requestContext.logEvent) {
    await prisma.loginEvent.create({
      data: {
        userId: user.id,
        ip: requestContext.ip || null,
        userAgent: requestContext.userAgent || null
      }
    });
  }

  setAuthCookies(res, accessToken, refreshToken);
}

async function signup(req, res) {
  throw createHttpError(410, "Email/password auth is disabled. Use Google authentication.");
}

async function login(req, res) {
  throw createHttpError(410, "Email/password auth is disabled. Use Google authentication.");
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await prisma.user.update({
        where: { id: payload.sub },
        data: { refreshToken: null }
      });
    }
  } catch {
    // no-op: logout should still clear cookies
  }

  clearAuthCookies(res);
  return res.json({ ok: true });
}

async function refresh(req, res) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    throw createHttpError(401, "No refresh token");
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw createHttpError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshToken) {
    throw createHttpError(401, "Invalid refresh token");
  }

  const refreshMatches = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!refreshMatches) {
    throw createHttpError(401, "Invalid refresh token");
  }

  const accessToken = signAccessToken(user);
  setAuthCookies(res, accessToken);

  return res.json({ ok: true });
}

async function me(req, res) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.json({ user: null });
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.json({ user: null });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        emailVerifiedAt: user.emailVerifiedAt
      }
    });
  } catch {
    return res.json({ user: null });
  }
}

async function googleCallback(req, res) {
  const googleUser = req.user;
  if (!googleUser?.email) {
    throw createHttpError(401, "Google authentication failed");
  }

  const base = getFrontendOrigin(req);
  const existing = await prisma.user.findUnique({
    where: { email: googleUser.email.toLowerCase() }
  });

  if (existing) {
    await issueSession(res, existing, {
      logEvent: true,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    clearGooglePendingCookie(res);
    return res.redirect(`${base}${FRONTEND_REDIRECT_SUCCESS}`);
  }

  const pendingToken = signPendingGoogleRegistrationToken({
    email: googleUser.email.toLowerCase(),
    name: googleUser.name || null
  });
  setGooglePendingCookie(res, pendingToken);

  return res.redirect(`${base}${FRONTEND_REDIRECT_REGISTER}`);
}

async function googlePending(req, res) {
  const pendingToken = req.cookies?.google_pending_token;
  if (!pendingToken) {
    return res.json({ pending: false });
  }

  try {
    const payload = verifyPendingGoogleRegistrationToken(pendingToken);
    return res.json({
      pending: true,
      email: payload.email,
      name: payload.name || null
    });
  } catch {
    clearGooglePendingCookie(res);
    return res.json({ pending: false });
  }
}

async function googleRegister(req, res) {
  const pendingToken = req.cookies?.google_pending_token;
  if (!pendingToken) {
    throw createHttpError(401, "Google registration session expired. Please continue with Google again.");
  }

  let payload;
  try {
    payload = verifyPendingGoogleRegistrationToken(pendingToken);
  } catch {
    clearGooglePendingCookie(res);
    throw createHttpError(401, "Google registration session expired. Please continue with Google again.");
  }

  const email = String(payload.email || "").toLowerCase();
  if (!email) {
    clearGooglePendingCookie(res);
    throw createHttpError(400, "Invalid Google registration payload");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await issueSession(res, existing, {
      logEvent: true,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    clearGooglePendingCookie(res);
    return res.json({
      ok: true,
      user: {
        id: existing.id,
        email: existing.email,
        role: existing.role,
        name: existing.name,
        emailVerifiedAt: existing.emailVerifiedAt
      }
    });
  }

  const generatedPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(generatedPassword, 12);
  const requestedName = req.validatedBody?.name?.trim();
  const fallbackName = payload.name ? String(payload.name).trim() : null;
  const { country: mobileCountry, phone: mobilePhone } = normalizeRegistrationMobile(
    req.validatedBody?.mobileCountry,
    req.validatedBody?.mobile
  );
  if (!mobilePhone) {
    throw createHttpError(400, "Invalid mobile number");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: requestedName || fallbackName || null,
      passwordHash,
      mobileCountry,
      mobilePhone
    }
  });

  await issueSession(res, user, {
    logEvent: true,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  clearGooglePendingCookie(res);
  return res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt
    }
  });
}

function googleFailureRedirect(req, res) {
  const base = getFrontendOrigin(req);
  const redirectTo = `${base}${FRONTEND_REDIRECT_FAILURE}`;
  return res.redirect(redirectTo);
}

module.exports = {
  signup,
  login,
  logout,
  refresh,
  me,
  googleCallback,
  googlePending,
  googleRegister,
  googleFailureRedirect
};
