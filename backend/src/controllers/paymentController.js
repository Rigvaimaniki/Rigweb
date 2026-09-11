const crypto = require("crypto");
const Razorpay = require("razorpay");
const prisma = require("../prisma");
const { createHttpError } = require("../utils/errors");
const { sendMail } = require("../utils/mailer");

function normalizeCourseName(value) {
  return String(value || "").trim();
}

function normalizeBillingName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return name ? name.slice(0, 120) : "";
}

function normalizeBillingPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  // Enforce India (+91) while accepting common input formats.
  // Returns E.164: +91XXXXXXXXXX
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  if (local.length === 11 && local.startsWith("0")) local = local.slice(1);

  if (!/^\d{10}$/.test(local)) return "";
  return `+91${local}`;
}

function normalizeCourseKey(value) {
  return normalizeCourseName(value).toLowerCase().replace(/\s+/g, " ");
}

const COURSE_CATALOG = Object.freeze({
  "basic drone program": Object.freeze({ canonicalName: "Basic Drone Program", originalInr: 5000, discountPercent: 40 }),
  "fixed wing drone": Object.freeze({ canonicalName: "Fixed Wing Drone", originalInr: 10000, discountPercent: 50 }),
  "multicopter drone": Object.freeze({ canonicalName: "Multicopter Drone", originalInr: 10000, discountPercent: 50 }),
  "ai in drone": Object.freeze({ canonicalName: "AI in Drone", originalInr: 10000, discountPercent: 50 }),
  "frame designing for uavs": Object.freeze({
    canonicalName: "Frame Designing for UAVs",
    originalInr: 25000,
    discountPercent: 0
  })
});

const COURSE_ALIASES = Object.freeze({
  "basic course": "basic drone program",
  "ai drone / fixed wing": "fixed wing drone",
  "frame designing for uav's": "frame designing for uavs",
  "frame designing for uavs'": "frame designing for uavs",
  "frame designing for uav": "frame designing for uavs",
  "frame designing for uav’s": "frame designing for uavs"
});

function getCatalogCoursePricing(courseName) {
  const inputKey = normalizeCourseKey(courseName);
  const resolvedKey = COURSE_CATALOG[inputKey] ? inputKey : COURSE_ALIASES[inputKey];
  if (!resolvedKey) return null;

  const base = COURSE_CATALOG[resolvedKey];
  if (!base) return null;

  const discountInr = Math.round((Number(base.originalInr) * Number(base.discountPercent || 0)) / 100);
  const payableInr = Math.max(0, Number(base.originalInr) - discountInr);

  return {
    key: resolvedKey,
    canonicalName: base.canonicalName,
    originalInr: Number(base.originalInr),
    discountPercent: Number(base.discountPercent || 0),
    discountInr,
    payableInr,
    payablePaise: Math.round(payableInr * 100)
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

async function resolveCoursePricing({ courseId, courseName }) {
  const normalizedName = courseName ? normalizeCourseName(courseName) : "";
  const normalizedId = courseId && isUuid(courseId) ? String(courseId).trim() : null;

  let course = null;
  if (normalizedId) {
    course = await prisma.course.findUnique({ where: { id: normalizedId } });
  }

  if (!course && normalizedName) {
    course = await prisma.course.findFirst({
      where: {
        title: { equals: normalizedName, mode: "insensitive" }
      }
    });
  }

  if (course) {
    const originalInr = Number(course.price) || 0;
    const discountPercent = Math.min(100, Math.max(0, Number(course.discountPercent) || 0));
    const discountInr = Math.round((originalInr * discountPercent) / 100);
    const payableInr = Math.max(0, originalInr - discountInr);
    return {
      courseId: course.id,
      canonicalName: course.title,
      originalInr,
      discountPercent,
      discountInr,
      payableInr,
      payablePaise: Math.round(payableInr * 100)
    };
  }

  // Backwards-compatible fallback for older frontends that send courseName.
  const catalogPricing = getCatalogCoursePricing(normalizedName);
  return catalogPricing ? { ...catalogPricing, courseId: null } : null;
}

function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    throw createHttpError(503, "Razorpay is not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// In-memory store: orderId -> purchase record.
// Replace with Prisma or another DB if you want persistence.
const purchases = new Map();

const INVOICE_CONTACT_PHONE = "+91 6367803161";
const INVOICE_ADDRESS = "iStart Nest Incubation Center Gov. Polytechnic College, Jodhpur";

function formatInr(value) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `INR ${value}`;
  }
}

function buildInvoiceText(purchase) {
  const lines = [
    "Congratulations! You have successfully enrolled in our course.",
    "",
    `Course: ${purchase.courseName}`,
    ...(purchase.billingName ? [`Name: ${purchase.billingName}`] : []),
    ...(purchase.billingPhone ? [`Mobile: ${purchase.billingPhone}`] : []),
    ...(purchase.email ? [`Email: ${purchase.email}`] : []),
    ...(purchase.dateOfBirth ? [`Date of Birth: ${new Date(purchase.dateOfBirth).toLocaleDateString()}`] : []),
    ...(purchase.city && purchase.state ? [`Location: ${purchase.city}, ${purchase.state}`] : []),
    ...(purchase.preferredBatch ? [`Preferred Batch: ${purchase.preferredBatch}`] : []),
    ...(purchase.experienceLevel ? [`Experience Level: ${purchase.experienceLevel}`] : []),
    ...(purchase.profession ? [`Profession: ${purchase.profession}`] : []),
    ...(purchase.college ? [`College: ${purchase.college}`] : []),
    `Transaction amount: ${formatInr(purchase?.pricing?.payableInr ?? Math.round((purchase.amount || 0) / 100))}`,
    `Razorpay Order ID: ${purchase.orderId}`,
    `Razorpay Payment ID: ${purchase.paymentId || "-"}`,
    `Date: ${purchase.paidAt || purchase.createdAt}`,
    "",
    "Our team will reach out to you soon for further details and course commencement.",
    "",
    "For any queries, you can contact us:",
    `WhatsApp: +91 6367803161`,
    `Email: info@rigvaimaniki.com`,
    "",
    "Thank you for choosing Rigvaimaniki Technologies!"
  ];

  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildInvoiceHtml(purchase) {
  const transactionAmount = formatInr(purchase?.pricing?.payableInr ?? Math.round((purchase.amount || 0) / 100));
  const billingNameRow = purchase.billingName
    ? `<tr><td style="padding:6px 0;color:#555">Name</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.billingName)}</td></tr>`
    : "";
  const billingPhoneRow = purchase.billingPhone
    ? `<tr><td style="padding:6px 0;color:#555">Mobile</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.billingPhone)}</td></tr>`
    : "";
  const emailRow = purchase.email
    ? `<tr><td style="padding:6px 0;color:#555">Email</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.email)}</td></tr>`
    : "";
  const dobRow = purchase.dateOfBirth
    ? `<tr><td style="padding:6px 0;color:#555">Date of Birth</td><td style="padding:6px 0;font-weight:700">${escapeHtml(new Date(purchase.dateOfBirth).toLocaleDateString())}</td></tr>`
    : "";
  const locationRow = (purchase.city && purchase.state)
    ? `<tr><td style="padding:6px 0;color:#555">Location</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.city)}, ${escapeHtml(purchase.state)}</td></tr>`
    : "";
  const batchRow = purchase.preferredBatch
    ? `<tr><td style="padding:6px 0;color:#555">Preferred Batch</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.preferredBatch)}</td></tr>`
    : "";
  const experienceRow = purchase.experienceLevel
    ? `<tr><td style="padding:6px 0;color:#555">Experience Level</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.experienceLevel)}</td></tr>`
    : "";
  const professionRow = purchase.profession
    ? `<tr><td style="padding:6px 0;color:#555">Profession</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.profession)}</td></tr>`
    : "";
  const collegeRow = purchase.college
    ? `<tr><td style="padding:6px 0;color:#555">College</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.college)}</td></tr>`
    : "";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Enrollment Successful!</h2>
      <p style="margin:0 0 16px">Congratulations! You have successfully enrolled in our course.</p>

      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:520px">
        <tr><td style="padding:6px 0;color:#555">Course</td><td style="padding:6px 0;font-weight:700">${escapeHtml(purchase.courseName)}</td></tr>
        ${billingNameRow}
        ${billingPhoneRow}
        ${emailRow}
        ${dobRow}
        ${locationRow}
        ${batchRow}
        ${experienceRow}
        ${professionRow}
        ${collegeRow}
        <tr><td style="padding:6px 0;color:#555">Transaction amount</td><td style="padding:6px 0;font-weight:700">${escapeHtml(transactionAmount)}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Razorpay Order ID</td><td style="padding:6px 0">${escapeHtml(purchase.orderId)}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Razorpay Payment ID</td><td style="padding:6px 0">${escapeHtml(purchase.paymentId || "-")}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Date</td><td style="padding:6px 0">${escapeHtml(purchase.paidAt || purchase.createdAt)}</td></tr>
      </table>

      <hr style="margin:18px 0;border:none;border-top:1px solid #eee" />
      <p style="margin:0 0 12px"><strong>Our team will reach out to you soon for further details and course commencement.</strong></p>
      <p style="margin:0"><b>For any queries, contact us:</b></p>
      <p style="margin:6px 0 0"><b>WhatsApp:</b> +91 6367803161</p>
      <p style="margin:6px 0 0"><b>Email:</b> info@rigvaimaniki.com</p>
      <p style="margin:12px 0 0">Thank you for choosing Rigvaimaniki Technologies!</p>
    </div>
  `;
}

async function enrollStudent(req, res) {
  const courseId = req.body?.courseId ? String(req.body.courseId).trim() : null;
  const courseName = normalizeCourseName(req.body?.courseName || req.body?.course);
  if (!courseId && !courseName) {
    throw createHttpError(400, "courseId (or courseName) is required");
  }

  const billingName = normalizeBillingName(req.body?.billingName || req.body?.name);
  const billingPhone = normalizeBillingPhone(req.body?.billingPhone || req.body?.phone || req.body?.mobile);
  if ((req.body?.billingPhone || req.body?.phone || req.body?.mobile) && !billingPhone) {
    throw createHttpError(400, "Invalid billing phone. Use an Indian number (+91).");
  }

  // New enrollment fields
  const firstName = req.body?.firstName ? String(req.body.firstName).trim() : null;
  const lastName = req.body?.lastName ? String(req.body.lastName).trim() : null;
  const gender = req.body?.gender ? String(req.body.gender).trim() : null;
  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : null;
  const dateOfBirth = req.body?.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
  const city = req.body?.city ? String(req.body.city).trim() : null;
  const state = req.body?.state ? String(req.body.state).trim() : null;
  const preferredBatch = req.body?.preferredBatch ? String(req.body.preferredBatch).trim() : null;
  const experienceLevel = req.body?.experienceLevel ? String(req.body.experienceLevel).trim() : null;
  const profession = req.body?.profession ? String(req.body.profession).trim() : null;
  const college = req.body?.college ? String(req.body.college).trim() : null;
  const agreedToFollowUp = Boolean(req.body?.agreedToFollowUp);

  // Validate required fields
  if (!firstName || !lastName) {
    throw createHttpError(400, "First name and last name are required");
  }
  if (!gender || !['male', 'female'].includes(gender)) {
    throw createHttpError(400, "Valid gender is required");
  }
  if (!billingPhone) {
    throw createHttpError(400, "Mobile number is required");
  }
  if (!email) {
    throw createHttpError(400, "Email is required");
  }
  if (!dateOfBirth) {
    throw createHttpError(400, "Date of birth is required");
  }
  if (!city || !state) {
    throw createHttpError(400, "City and state are required");
  }
  if (!preferredBatch || !['morning', 'afternoon', 'evening'].includes(preferredBatch)) {
    throw createHttpError(400, "Valid preferred batch is required");
  }
  if (!experienceLevel || !['beginner', 'prior_knowledge'].includes(experienceLevel)) {
    throw createHttpError(400, "Valid experience level is required");
  }
  if (!agreedToFollowUp) {
    throw createHttpError(400, "You must agree to share information and follow-up");
  }

  const pricing = await resolveCoursePricing({ courseId, courseName });
  if (!pricing) {
    throw createHttpError(400, "Invalid course");
  }

  // Check for duplicate enrollment
  const existingEnrollment = await prisma.courseEnrollment.findFirst({
    where: {
      email: email,
      status: "paid",
      ...(pricing.courseId
        ? { OR: [{ courseId: pricing.courseId }, { courseName: pricing.canonicalName }] }
        : { courseName: pricing.canonicalName })
    }
  });

  if (existingEnrollment) {
    throw createHttpError(400, "You are already enrolled in this course");
  }

  // Create enrollment without payment
  const enrollment = await prisma.courseEnrollment.create({
    data: {
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      billingName: billingName,
      billingPhone: billingPhone,
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      email: email,
      dateOfBirth: dateOfBirth,
      city: city,
      state: state,
      preferredBatch: preferredBatch,
      experienceLevel: experienceLevel,
      profession: profession,
      college: college,
      agreedToFollowUp: agreedToFollowUp,
      courseId: pricing.courseId,
      courseName: pricing.canonicalName,
      orderId: `enrollment_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
      paymentId: null,
      amountPaise: pricing.payablePaise,
      currency: "INR",
      pricing: {
        originalInr: pricing.originalInr,
        discountInr: pricing.discountInr,
        discountPercent: pricing.discountPercent,
        payableInr: pricing.payableInr
      },
      status: "created",
      paidAt: null
    }
  });

  // Send enrollment confirmation email
  let emailSent = false;
  if (email) {
    try {
      const emailText = buildEnrollmentEmailText(enrollment);
      const emailHtml = buildEnrollmentEmailHtml(enrollment);
      await sendMail({
        to: email,
        subject: "Rigvaimaniki Course Enrollment Confirmation",
        text: emailText,
        html: emailHtml
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return res.json({
    ok: true,
    enrollment: {
      id: enrollment.id,
      courseName: enrollment.courseName,
      orderId: enrollment.orderId
    },
    emailSent
  });
}

function buildEnrollmentEmailText(enrollment) {
  const lines = [
    `Hello ${enrollment.billingName},`,
    "",
    `Thank you for enrolling in our ${enrollment.courseName} program.`,
    "",
    "We've successfully received your details. Our team will contact you within the next 24–48 hours to guide you with:",
    "",
    "* Batch timing options",
    "* Training location details",
    "* Course schedule and next steps",
    "",
    "If you have any urgent questions, feel free to reach out to us:",
    "",
    "💬 WhatsApp: +91 6367803161",
    "📧 Email: info@rigvaimaniki.com",
    "",
    "We're excited to have you with us and look forward to helping you get started with your drone journey.",
    "",
    "Best regards,",
    "Rigvaimaniki Technologies"
  ];

  return lines.join("\n");
}

function buildEnrollmentEmailHtml(enrollment) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111">
      <p style="margin:0 0 16px"><strong>Hello ${escapeHtml(enrollment.billingName)},</strong></p>
      <p style="margin:0 0 16px">Thank you for enrolling in our <strong>${escapeHtml(enrollment.courseName)}</strong> program.</p>
      <p style="margin:0 0 16px">We've successfully received your details. Our team will contact you within the next <strong>24–48 hours</strong> to guide you with:</p>
      <ul style="margin:0 0 16px;padding-left:20px">
        <li>Batch timing options</li>
        <li>Training location details</li>
        <li>Course schedule and next steps</li>
      </ul>
      <p style="margin:0 0 16px">If you have any urgent questions, feel free to reach out to us:</p>
      <p style="margin:6px 0 0"><strong>💬 WhatsApp:</strong> +91 6367803161</p>
      <p style="margin:6px 0 0"><strong>📧 Email:</strong> info@rigvaimaniki.com</p>
      <p style="margin:16px 0 0">We're excited to have you with us and look forward to helping you get started with your drone journey.</p>
      <p style="margin:16px 0 0">Best regards,<br>Rigvaimaniki Technologies</p>
    </div>
  `;
}

async function createOrder(req, res) {
  const courseId = req.body?.courseId ? String(req.body.courseId).trim() : null;
  const courseName = normalizeCourseName(req.body?.courseName || req.body?.course);
  if (!courseId && !courseName) {
    throw createHttpError(400, "courseId (or courseName) is required");
  }

  const pricing = await resolveCoursePricing({ courseId, courseName });
  if (!pricing) {
    throw createHttpError(400, "Invalid course");
  }

  const billingName = normalizeBillingName(req.body?.billingName || req.body?.name);
  const billingPhoneInput = req.body?.billingPhone || req.body?.phone || req.body?.mobile;
  const billingPhone = billingPhoneInput ? normalizeBillingPhone(billingPhoneInput) : null;
  if (billingPhoneInput && !billingPhone) {
    throw createHttpError(400, "Invalid billing phone. Use an Indian number (+91).");
  }

  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : null;
  const razorpay = getRazorpayClient();

  const receipt = `course_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const order = await razorpay.orders.create({
    amount: pricing.payablePaise,
    currency: "INR",
    receipt,
    notes: {
      courseName: pricing.canonicalName,
      ...(billingName ? { billingName } : {}),
      ...(billingPhone ? { billingPhone } : {}),
      ...(email ? { email } : {}),
      originalInr: String(pricing.originalInr),
      discountInr: String(pricing.discountInr),
      payableInr: String(pricing.payableInr)
    }
  });

  purchases.set(order.id, {
    orderId: order.id,
    status: "created",
    courseId: pricing.courseId,
    courseName: pricing.canonicalName,
    billingName: billingName || null,
    billingPhone: billingPhone || null,
    userEmail: req.user?.email || email || null,
    pricing: {
      originalInr: pricing.originalInr,
      discountInr: pricing.discountInr,
      discountPercent: pricing.discountPercent,
      payableInr: pricing.payableInr
    },
    userId: req.user?.id || null,
    amount: order.amount,
    currency: order.currency,
    receipt,
    createdAt: new Date().toISOString(),
    paymentId: null
  });

  await prisma.coursePaymentAttempt.create({
    data: {
      orderId: order.id,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      billingName: billingName || null,
      billingPhone: billingPhone || null,
      courseId: pricing.courseId,
      courseName: pricing.canonicalName,
      paymentId: null,
      amountPaise: Number(order.amount),
      currency: String(order.currency || "INR"),
      pricing: {
        originalInr: pricing.originalInr,
        discountInr: pricing.discountInr,
        discountPercent: pricing.discountPercent,
        payableInr: pricing.payableInr
      },
      status: "created"
    }
  });

  return res.json({
    key_id: process.env.RAZORPAY_KEY_ID,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    courseName: pricing.canonicalName,
    pricing: {
      originalInr: pricing.originalInr,
      discountInr: pricing.discountInr,
      discountPercent: pricing.discountPercent,
      payableInr: pricing.payableInr
    }
  });
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ""), "utf8");
  const bBuf = Buffer.from(String(b || ""), "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

async function verifyPayment(req, res) {
  const razorpay_order_id = String(req.body?.razorpay_order_id || "").trim();
  const razorpay_payment_id = String(req.body?.razorpay_payment_id || "").trim();
  const razorpay_signature = String(req.body?.razorpay_signature || "").trim();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw createHttpError(400, "Missing Razorpay payment fields");
  }

  if (!isRazorpayConfigured()) {
    throw createHttpError(503, "Razorpay is not configured");
  }

  const purchase = purchases.get(razorpay_order_id);
  const attempt =
    (await prisma.coursePaymentAttempt.findUnique({
      where: { orderId: razorpay_order_id }
    })) || null;

  if (!purchase && !attempt) throw createHttpError(404, "Order not found");

  const purchaseUserId = purchase?.userId || attempt?.userId || null;
  if (purchaseUserId && req.user?.id && purchaseUserId !== req.user.id) {
    throw createHttpError(403, "Order does not belong to this user");
  }

  const alreadyPaid = purchase?.status === "paid" || attempt?.status === "paid";
  if (alreadyPaid) {
    return res.json({ ok: true, status: "paid", courseName: purchase?.courseName || attempt?.courseName || null });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = safeEqual(expected, razorpay_signature);
  if (!isValid) {
    if (attempt?.orderId) {
      await prisma.coursePaymentAttempt.update({
        where: { orderId: attempt.orderId },
        data: {
          status: "failed",
          failedAt: new Date(),
          failureStage: "verify",
          failureReason: "invalid_signature"
        }
      });
    }
    throw createHttpError(400, "Invalid payment signature");
  }

  const baseCourseName = purchase?.courseName || attempt?.courseName || null;
  const baseBillingName = purchase?.billingName || attempt?.billingName || null;
  const baseBillingPhone = purchase?.billingPhone || attempt?.billingPhone || null;
  const baseAmount = purchase?.amount || attempt?.amountPaise || 0;
  const baseCurrency = purchase?.currency || attempt?.currency || "INR";
  const basePricing = purchase?.pricing || attempt?.pricing || null;
  const baseCourseId = purchase?.courseId || attempt?.courseId || null;

  const updatedPurchase = {
    ...(purchase || {
      orderId: razorpay_order_id,
      status: "created",
      courseId: baseCourseId,
      courseName: baseCourseName,
      billingName: baseBillingName,
      billingPhone: baseBillingPhone,
      pricing: basePricing,
      userId: attempt?.userId || null,
      userEmail: attempt?.userEmail || null,
      amount: baseAmount,
      currency: baseCurrency,
      receipt: null,
      createdAt: new Date().toISOString(),
      paymentId: null
    }),
    status: "paid",
    paymentId: razorpay_payment_id,
    paidAt: new Date().toISOString()
  };

  purchases.set(razorpay_order_id, updatedPurchase);

  await prisma.coursePaymentAttempt.upsert({
    where: { orderId: razorpay_order_id },
    update: {
      status: "paid",
      paymentId: razorpay_payment_id,
      paidAt: new Date(),
      failureStage: null,
      failureReason: null,
      failureRaw: null,
      ...(baseCourseId ? { courseId: baseCourseId } : {}),
      ...(baseCourseName ? { courseName: baseCourseName } : {})
    },
    create: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId: req.user?.id || attempt?.userId || null,
      userEmail: req.user?.email || attempt?.userEmail || null,
      billingName: baseBillingName,
      billingPhone: baseBillingPhone,
      courseId: baseCourseId,
      courseName: baseCourseName,
      amountPaise: Number(baseAmount || 0),
      currency: String(baseCurrency || "INR"),
      pricing: basePricing,
      status: "paid",
      paidAt: new Date()
    }
  });

  // Only persist "enrollment" after successful payment.
  await prisma.courseEnrollment.upsert({
    where: { orderId: razorpay_order_id },
    update: {
      status: "paid",
      paymentId: razorpay_payment_id,
      paidAt: new Date()
    },
    create: {
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      billingName: baseBillingName,
      billingPhone: baseBillingPhone,
      firstName: req.body?.firstName || null,
      lastName: req.body?.lastName || null,
      gender: req.body?.gender || null,
      email: req.body?.email || null,
      dateOfBirth: req.body?.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
      city: req.body?.city || null,
      state: req.body?.state || null,
      preferredBatch: req.body?.preferredBatch || null,
      experienceLevel: req.body?.experienceLevel || null,
      profession: req.body?.profession || null,
      college: req.body?.college || null,
      agreedToFollowUp: Boolean(req.body?.agreedToFollowUp),
      courseId: baseCourseId,
      courseName: baseCourseName || "Unknown course",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountPaise: Number(baseAmount || 0),
      currency: String(baseCurrency || "INR"),
      pricing: basePricing,
      status: "paid",
      paidAt: new Date()
    }
  });

  let emailSent = false;
  const to = updatedPurchase.userEmail || req.user?.email || null;
  if (to) {
    try {
      await sendMail({
        to,
        subject: "Rigvaimaniki Course Registration - Invoice",
        text: buildInvoiceText(updatedPurchase),
        html: buildInvoiceHtml(updatedPurchase)
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return res.json({
    ok: true,
    status: "paid",
    courseName: updatedPurchase.courseName,
    emailSent
  });
}

async function recordPaymentAttemptFailure(req, res) {
  const orderId = req.body?.orderId ? String(req.body.orderId).trim() : null;
  const rawStatus = String(req.body?.status || "failed").toLowerCase().trim();
  const status = rawStatus === "cancelled" ? "cancelled" : "failed";

  const inputCourseId = req.body?.courseId ? String(req.body.courseId).trim() : null;
  const inputCourseName = req.body?.courseName ? normalizeCourseName(req.body.courseName) : null;
  const resolvedCourse =
    inputCourseId || inputCourseName
      ? await resolveCoursePricing({ courseId: inputCourseId, courseName: inputCourseName })
      : null;
  const courseId = resolvedCourse?.courseId || (inputCourseId && isUuid(inputCourseId) ? inputCourseId : null);
  const courseName = resolvedCourse?.canonicalName || inputCourseName || null;
  const billingName = req.body?.billingName ? normalizeBillingName(req.body.billingName) : null;
  const billingPhoneInput = req.body?.billingPhone || req.body?.phone || req.body?.mobile;
  const billingPhone = billingPhoneInput ? normalizeBillingPhone(billingPhoneInput) : null;
  if (billingPhoneInput && !billingPhone) {
    throw createHttpError(400, "Invalid billing phone. Use an Indian number (+91).");
  }

  const failureStage = req.body?.stage ? String(req.body.stage).slice(0, 50) : null;
  const failureReason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;
  const failureRaw = req.body?.raw && typeof req.body.raw === "object" ? req.body.raw : null;

  const now = new Date();
  const setTimes =
    status === "cancelled"
      ? { cancelledAt: now, failedAt: null, paidAt: null }
      : { failedAt: now, cancelledAt: null, paidAt: null };

  if (orderId) {
    const existing = await prisma.coursePaymentAttempt.findUnique({ where: { orderId } });
    if (existing?.status === "paid") {
      return res.json({ ok: true, ignored: true });
    }

    await prisma.coursePaymentAttempt.upsert({
      where: { orderId },
      update: {
        status,
        ...setTimes,
        failureStage,
        failureReason,
        failureRaw,
        ...(courseId ? { courseId } : {}),
        ...(courseName ? { courseName } : {}),
        ...(billingName ? { billingName } : {}),
        ...(billingPhone ? { billingPhone } : {})
      },
      create: {
        orderId,
        paymentId: null,
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        billingName,
        billingPhone,
        courseId,
        courseName,
        amountPaise: null,
        currency: "INR",
        pricing: null,
        status,
        ...setTimes,
        failureStage,
        failureReason,
        failureRaw
      }
    });

    return res.json({ ok: true });
  }

  // No orderId: still capture the failed attempt for debugging/ops.
  await prisma.coursePaymentAttempt.create({
    data: {
      orderId: null,
      paymentId: null,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      billingName,
      billingPhone,
      courseName,
      amountPaise: null,
      currency: "INR",
      pricing: null,
      status,
      ...setTimes,
      failureStage,
      failureReason,
      failureRaw
    }
  });

  return res.json({ ok: true });
}

async function getPurchaseStatus(req, res) {
  const orderId = String(req.params?.orderId || "").trim();
  if (!orderId) throw createHttpError(400, "orderId is required");

  const attempt = await prisma.coursePaymentAttempt.findUnique({ where: { orderId } });
  if (attempt) {
    return res.json({
      found: true,
      status: attempt.status,
      courseName: attempt.courseName || null,
      orderId,
      paymentId: attempt.paymentId || null
    });
  }

  const enrollment = await prisma.courseEnrollment.findUnique({ where: { orderId } });
  if (!enrollment) return res.status(404).json({ found: false });

  return res.json({
    found: true,
    status: enrollment.status,
    courseName: enrollment.courseName,
    orderId,
    paymentId: enrollment.paymentId || null
  });
}

module.exports = {
  createOrder,
  enrollStudent,
  recordPaymentAttemptFailure,
  verifyPayment,
  getPurchaseStatus
};
