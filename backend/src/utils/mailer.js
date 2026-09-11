const nodemailer = require("nodemailer");

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

function getTransporter() {
  if (!isMailConfigured()) return null;

  const port = parseInt(String(process.env.SMTP_PORT), 10);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || ""
        }
      : undefined
  });
}

async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: "SMTP not configured" };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });

  return { sent: true };
}

module.exports = { isMailConfigured, sendMail };

