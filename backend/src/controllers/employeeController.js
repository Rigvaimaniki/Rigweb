const path = require("path");
const fs = require("fs");
const prisma = require("../prisma");
const { createHttpError } = require("../utils/errors");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(s1 + s2));
}

function minutesFromDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function minutesFromTimeText(value) {
  if (!value) return null;
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function calculateAttendance(shift, data) {
  const checkInMinutes = minutesFromDate(data.checkInAt);
  const checkOutMinutes = minutesFromDate(data.checkOutAt);
  const startMinutes = minutesFromTimeText(shift?.startTime);
  const endMinutes = minutesFromTimeText(shift?.endTime);
  const requiredMinutes =
    shift?.requiredWorkingMinutes ??
    (startMinutes !== null && endMinutes !== null
      ? ((endMinutes - startMinutes + 1440) % 1440) - (shift?.breakDurationMinutes || 0)
      : null);

  let totalWorkingMinutes = 0;
  if (data.checkInAt && data.checkOutAt) {
    totalWorkingMinutes = Math.max(0, Math.round((new Date(data.checkOutAt).getTime() - new Date(data.checkInAt).getTime()) / 60000));
    totalWorkingMinutes = Math.max(0, totalWorkingMinutes - (shift?.breakDurationMinutes || 0));
  }

  const lateMinutes =
    checkInMinutes !== null && startMinutes !== null
      ? Math.max(0, checkInMinutes - startMinutes - (shift?.gracePeriodMinutes || 0))
      : 0;
  const earlyDepartureMinutes =
    checkOutMinutes !== null && endMinutes !== null ? Math.max(0, endMinutes - checkOutMinutes) : 0;
  const overtimeMinutes =
    requiredMinutes !== null
      ? Math.max(0, totalWorkingMinutes - requiredMinutes - (shift?.overtimeThresholdMinutes || 0))
      : 0;

  let status = "Present";
  if (requiredMinutes && totalWorkingMinutes > 0 && totalWorkingMinutes < requiredMinutes / 2) status = "Half Day";
  else if (lateMinutes > 0) status = "Late Arrival";
  else if (earlyDepartureMinutes > 0) status = "Early Departure";
  else if (overtimeMinutes > 0) status = "Overtime";

  return { status, lateMinutes, earlyDepartureMinutes, overtimeMinutes, totalWorkingMinutes };
}

async function findEmployeeProfileForRequest(req) {
  const employee = await prisma.employeeProfile.findUnique({
    where: { email: normalizeEmail(req.user.email) },
    include: {
      attendanceRecords: { orderBy: { attendanceDate: "desc" }, take: 30 },
      documents: { orderBy: { createdAt: "desc" }, take: 30 },
      lifecycleHistory: { orderBy: { effectiveDate: "desc" }, take: 30 },
      shiftHistory: { orderBy: { effectiveDate: "desc" }, take: 30 },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 30 },
      officeLocation: true,
      shift: true
    }
  });

  if (!employee) {
    throw createHttpError(404, "No employee or intern record matches this email");
  }

  return employee;
}

async function getMyEmployeeProfile(req, res) {
  const employee = await findEmployeeProfileForRequest(req);
  const [officeLocations, documentCategories] = await Promise.all([
    prisma.officeLocation.findMany({ where: { isActive: true }, orderBy: { officeName: "asc" } }),
    prisma.documentCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return res.json({ employee, officeLocations, documentCategories });
}

async function markMyAttendance(req, res) {
  const employee = await findEmployeeProfileForRequest(req);
  const { action, officeLocationId, latitude, longitude } = req.validatedBody;
  const today = getTodayDate();
  const now = new Date();
  const userAgent = req.headers["user-agent"] || null;
  const office = await prisma.officeLocation.findUnique({ where: { id: officeLocationId } });

  if (!office || !office.isActive) {
    throw createHttpError(400, "Selected office location is not available");
  }

  const distance = distanceMeters(latitude, longitude, office.latitude, office.longitude);
  if (distance > office.allowedRadiusMeters) {
    throw createHttpError(
      403,
      `Attendance denied. You are ${Math.round(distance)}m away from ${office.officeName}; allowed radius is ${office.allowedRadiusMeters}m.`
    );
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      employeeProfileId_attendanceDate: {
        employeeProfileId: employee.id,
        attendanceDate: today
      }
    }
  });

  const updateData =
    action === "check_in"
      ? {
          officeLocationId,
          checkInAt: now,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInIp: req.ip || null,
          checkInDevice: userAgent
        }
      : {
          officeLocationId,
          checkOutAt: now,
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          checkOutIp: req.ip || null,
          checkOutDevice: userAgent
        };
  const computed = calculateAttendance(employee.shift, {
    checkInAt: action === "check_in" ? now : existing?.checkInAt || null,
    checkOutAt: action === "check_out" ? now : existing?.checkOutAt || null
  });

  const attendance = await prisma.attendanceRecord.upsert({
    where: {
      employeeProfileId_attendanceDate: {
        employeeProfileId: employee.id,
        attendanceDate: today
      }
    },
    update: { ...updateData, ...computed },
    create: {
      employeeProfileId: employee.id,
      attendanceDate: today,
      ...updateData,
      ...computed
    }
  });

  return res.json({ ok: true, attendance });
}

async function applyForLeave(req, res) {
  const employee = await findEmployeeProfileForRequest(req);
  const leave = await prisma.leaveRequest.create({
    data: {
      employeeProfileId: employee.id,
      leaveType: req.validatedBody.leaveType,
      startDate: req.validatedBody.startDate,
      endDate: req.validatedBody.endDate,
      reason: req.validatedBody.reason || null
    }
  });
  return res.status(201).json({ ok: true, leave });
}

async function uploadMyDocument(req, res) {
  const employee = await findEmployeeProfileForRequest(req);
  const file = req.file;
  const category = req.validatedBody.category;

  if (!file) throw createHttpError(400, "No file uploaded");

  const allowedMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ]);
  if (!allowedMimeTypes.has(file.mimetype)) {
    fs.unlinkSync(file.path);
    throw createHttpError(400, "Only PDF and image documents are allowed");
  }

  const documentsDir = path.resolve(process.cwd(), "public", "employee-documents");
  if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

  const ext = path.extname(file.originalname) || "";
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${employee.employeeId}_${safeCategory}_${Date.now()}${ext}`;
  const destPath = path.join(documentsDir, filename);
  fs.renameSync(file.path, destPath);

  const document = await prisma.employeeDocument.create({
    data: {
      employeeProfileId: employee.id,
      category,
      fileName: file.originalname,
      fileUrl: `/employee-documents/${filename}`,
      uploadedByUserId: req.user.id
    }
  });

  return res.status(201).json({ ok: true, document });
}

module.exports = {
  getMyEmployeeProfile,
  markMyAttendance,
  applyForLeave,
  uploadMyDocument
};
