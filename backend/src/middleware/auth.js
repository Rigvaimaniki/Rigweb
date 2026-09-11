const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { createHttpError } = require("../utils/errors");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(createHttpError(401, "Not authenticated"));
  }

  if (!["admin", "super_admin"].includes(req.user.role)) {
    return next(createHttpError(403, "Admin access required"));
  }

  return next();
}

function requireVerifiedEmployeeAccess(req, res, next) {
  if (!req.user) {
    return next(createHttpError(401, "Not authenticated"));
  }

  if (["admin", "super_admin"].includes(req.user.role) || req.user.emailVerifiedAt) {
    return next();
  }

  return next(createHttpError(403, "Employee access requires admin verification"));
}

module.exports = { requireAuth, requireAdmin, requireVerifiedEmployeeAccess };
