const { Prisma } = require("@prisma/client");

function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message;

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    statusCode = 404;
    message = "Resource not found";
  }

  const fallbackMessage = statusCode === 500 ? "Internal server error" : "Request failed";
  message = message || fallbackMessage;

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({ error: message });
}

module.exports = { notFound, errorHandler };
