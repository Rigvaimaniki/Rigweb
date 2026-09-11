const jwt = require("jsonwebtoken");

function signAccessToken(user) {
  const minutes = parseInt(process.env.ACCESS_TOKEN_EXPIRES_MIN || "15", 10);
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: `${minutes}m` }
  );
}

function signRefreshToken(user) {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10);
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${days}d` }
  );
}

function signPendingGoogleRegistrationToken(payload) {
  const secret = process.env.JWT_PENDING_REG_SECRET || process.env.JWT_ACCESS_SECRET;
  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

function verifyPendingGoogleRegistrationToken(token) {
  const secret = process.env.JWT_PENDING_REG_SECRET || process.env.JWT_ACCESS_SECRET;
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signPendingGoogleRegistrationToken,
  verifyPendingGoogleRegistrationToken
};
