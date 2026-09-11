function cookieOpts() {
  const secure = String(process.env.COOKIE_SECURE).toLowerCase() === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/"
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const accessMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRES_MIN || "15", 10);
  const refreshDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10);

  res.cookie("access_token", accessToken, {
    ...cookieOpts(),
    maxAge: accessMinutes * 60 * 1000
  });

  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, {
      ...cookieOpts(),
      maxAge: refreshDays * 24 * 60 * 60 * 1000
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", cookieOpts());
  res.clearCookie("refresh_token", cookieOpts());
}

function setGooglePendingCookie(res, token) {
  res.cookie("google_pending_token", token, {
    ...cookieOpts(),
    maxAge: 15 * 60 * 1000
  });
}

function clearGooglePendingCookie(res) {
  res.clearCookie("google_pending_token", cookieOpts());
}

module.exports = {
  cookieOpts,
  setAuthCookies,
  clearAuthCookies,
  setGooglePendingCookie,
  clearGooglePendingCookie
};
