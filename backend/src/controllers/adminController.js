const prisma = require("../prisma");
const { createHttpError } = require("../utils/errors");
const { sendMail } = require("../utils/mailer");
const path = require("path");
const fs = require("fs");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getRequestIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || null;
}

async function writeAudit(req, action, { targetUserId = null, meta = null, oldValue = null, newValue = null } = {}) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: req.user.id,
      targetUserId,
      action,
      meta,
      oldValue,
      newValue,
      ip: getRequestIp(req)
    }
  });
}

async function nextEmployeeId() {
  const latest = await prisma.employeeProfile.findFirst({
    where: { employeeId: { startsWith: "EMP-" } },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true }
  });
  const lastNumber = Number(String(latest?.employeeId || "").replace("EMP-", "")) || 0;
  return `EMP-${String(lastNumber + 1).padStart(4, "0")}`;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

async function calculateAttendance(employeeProfileId, data) {
  const employee = await prisma.employeeProfile.findUnique({
    where: { id: employeeProfileId },
    include: { shift: true }
  });

  const shift = employee?.shift || null;
  const checkInAt = data.checkInAt || null;
  const checkOutAt = data.checkOutAt || null;
  const checkInMinutes = minutesFromDate(checkInAt);
  const checkOutMinutes = minutesFromDate(checkOutAt);
  const startMinutes = minutesFromTimeText(shift?.startTime);
  const endMinutes = minutesFromTimeText(shift?.endTime);
  const requiredMinutes =
    shift?.requiredWorkingMinutes ??
    (startMinutes !== null && endMinutes !== null
      ? ((endMinutes - startMinutes + 1440) % 1440) - (shift?.breakDurationMinutes || 0)
      : null);

  let totalWorkingMinutes = 0;
  if (checkInAt && checkOutAt) {
    totalWorkingMinutes = Math.max(0, Math.round((new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 60000));
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

  let status = data.status || "Present";
  if (!checkInAt && !checkOutAt) status = "Absent";
  else if (requiredMinutes && totalWorkingMinutes > 0 && totalWorkingMinutes < requiredMinutes / 2) status = "Half Day";
  else if (lateMinutes > 0) status = "Late Arrival";
  else if (earlyDepartureMinutes > 0) status = "Early Departure";
  else if (overtimeMinutes > 0) status = "Overtime";

  return { status, lateMinutes, earlyDepartureMinutes, overtimeMinutes, totalWorkingMinutes };
}

async function ensureDefaultEmployeeSettings() {
  const [departmentCount, designationCount, shiftCount, categoryCount, officeCount] = await Promise.all([
    prisma.department.count(),
    prisma.designation.count(),
    prisma.shift.count(),
    prisma.documentCategory.count(),
    prisma.officeLocation.count()
  ]);

  if (departmentCount === 0) {
    await prisma.department.createMany({
      data: ["AI/ML", "Software Development", "Web Development", "HR", "Sales", "Marketing", "Operations", "Finance", "Administration", "Maintenance", "Security", "Housekeeping", "Building Management"].map((name) => ({ name })),
      skipDuplicates: true
    });
  }

  if (designationCount === 0) {
    await prisma.designation.createMany({
      data: [
        ["AI/ML Intern", "Technical"],
        ["AI Engineer", "Technical"],
        ["Data Scientist", "Technical"],
        ["Software Engineer", "Technical"],
        ["Senior Software Engineer", "Technical"],
        ["Team Lead", "Technical"],
        ["Project Manager", "Technical"],
        ["HR Executive", "Management"],
        ["HR Manager", "Management"],
        ["Operations Manager", "Management"],
        ["CMO", "Management"],
        ["Director", "Management"],
        ["Maintenance Staff", "Maintenance & Facilities"],
        ["Facility Manager", "Maintenance & Facilities"],
        ["Building Supervisor", "Maintenance & Facilities"],
        ["Electrician", "Maintenance & Facilities"],
        ["Plumber", "Maintenance & Facilities"],
        ["Technician", "Maintenance & Facilities"],
        ["Housekeeping Staff", "Maintenance & Facilities"],
        ["Cleaning Staff", "Maintenance & Facilities"],
        ["Security Guard", "Maintenance & Facilities"],
        ["Receptionist", "Maintenance & Facilities"]
      ].map(([name, groupName]) => ({ name, groupName })),
      skipDuplicates: true
    });
  }

  if (shiftCount === 0) {
    await prisma.shift.createMany({
      data: [
        { shiftName: "General Shift", startTime: "09:00", endTime: "18:00", gracePeriodMinutes: 15, breakDurationMinutes: 60, overtimeThresholdMinutes: 30, weeklyOffDays: ["Sunday"] },
        { shiftName: "Morning Shift", startTime: "06:00", endTime: "14:00", gracePeriodMinutes: 15, breakDurationMinutes: 30, overtimeThresholdMinutes: 30, weeklyOffDays: ["Sunday"] },
        { shiftName: "Evening Shift", startTime: "14:00", endTime: "22:00", gracePeriodMinutes: 15, breakDurationMinutes: 30, overtimeThresholdMinutes: 30, weeklyOffDays: ["Sunday"] },
        { shiftName: "Night Shift", startTime: "22:00", endTime: "06:00", gracePeriodMinutes: 15, breakDurationMinutes: 30, overtimeThresholdMinutes: 30, weeklyOffDays: ["Sunday"] },
        { shiftName: "Flexible Shift", requiredWorkingMinutes: 480, isFlexible: true, gracePeriodMinutes: 0, breakDurationMinutes: 0, overtimeThresholdMinutes: 30, weeklyOffDays: ["Sunday"] }
      ],
      skipDuplicates: true
    });
  }

  if (categoryCount === 0) {
    await prisma.documentCategory.createMany({
      data: ["Aadhaar", "PAN", "Offer Letter", "NOC", "NDA", "Resume", "Educational Certificates", "Internship Certificates", "Relieving Letter", "Experience Letter"].map((name) => ({ name })),
      skipDuplicates: true
    });
  }

  if (officeCount === 0) {
    await prisma.officeLocation.create({
      data: {
        officeName: "Jodhpur Office",
        officeAddress: "Jodhpur",
        latitude: 26.2389,
        longitude: 73.0243,
        allowedRadiusMeters: 100
      }
    });
  }
}

async function getUsers(req, res) {
  const q = req.query?.q ? String(req.query.q).trim() : "";
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { mobilePhone: { contains: q } }
          ]
        }
      : undefined,
    select: {
      id: true,
      email: true,
      name: true,
      mobileCountry: true,
      mobilePhone: true,
      role: true,
      emailVerifiedAt: true,
      lastLoginAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ users });
}

async function updateUserRole(req, res) {
  const { id } = req.validatedParams;
  const { role } = req.validatedBody;

  if (req.user.id === id && role !== "admin") {
    throw createHttpError(400, "You cannot remove your own admin access");
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      mobileCountry: true,
      mobilePhone: true,
      role: true,
      emailVerifiedAt: true,
      lastLoginAt: true
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: req.user.id,
      targetUserId: id,
      action: role === "admin" ? "user_role_set_admin" : "user_role_set_user",
      meta: { role }
    }
  });

  return res.json({ ok: true, user });
}

async function updateUserVerification(req, res) {
  const { id } = req.validatedParams;
  const { verified } = req.validatedBody;

  const user = await prisma.user.update({
    where: { id },
    data: { emailVerifiedAt: verified ? new Date() : null },
    select: {
      id: true,
      email: true,
      name: true,
      mobileCountry: true,
      mobilePhone: true,
      role: true,
      emailVerifiedAt: true,
      lastLoginAt: true
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: req.user.id,
      targetUserId: id,
      action: verified ? "user_email_verified" : "user_email_unverified",
      meta: { verified }
    }
  });

  return res.json({ ok: true, user });
}

async function deleteUser(req, res) {
  const { id } = req.validatedParams;

  if (req.user.id === id) {
    throw createHttpError(400, "You cannot delete your own account");
  }

  await prisma.user.delete({ where: { id } });
  await prisma.adminAuditLog.create({
    data: {
      actorId: req.user.id,
      targetUserId: id,
      action: "user_deleted",
      meta: null
    }
  });
  return res.json({ ok: true });
}

async function getLoginEvents(req, res) {
  const events = await prisma.loginEvent.findMany({
    select: {
      id: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  return res.json({ events });
}

async function getEmployeeProfiles(req, res) {
  const q = req.query?.q ? String(req.query.q).trim() : "";
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
          { employeeId: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
          { designation: { contains: q, mode: "insensitive" } }
        ]
      }
    : undefined;

  const employees = await prisma.employeeProfile.findMany({
    where,
    include: {
      attendanceRecords: { orderBy: { attendanceDate: "desc" }, take: 10 },
      documents: { orderBy: { createdAt: "desc" }, take: 10 },
      lifecycleHistory: { orderBy: { effectiveDate: "desc" }, take: 10 },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      officeLocation: true,
      shift: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ employees });
}

async function createEmployeeProfile(req, res) {
  const body = req.validatedBody;
  const email = normalizeEmail(body.email);
  const employee = await prisma.employeeProfile.create({
    data: {
      ...body,
      email,
      employeeId: await nextEmployeeId(),
      assignedShift: undefined
    }
  });

  if (employee.shiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: employee.shiftId } });
    if (shift) {
      await prisma.employeeProfile.update({
        where: { id: employee.id },
        data: { assignedShift: shift.shiftName }
      });
    }
  }

  await writeAudit(req, "employee_profile_created", {
    meta: { employeeProfileId: employee.id, email: employee.email },
    newValue: employee
  });

  return res.status(201).json({ ok: true, employee });
}

async function updateEmployeeProfile(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.employeeProfile.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, "Employee profile not found");

  const data = { ...req.validatedBody };
  if (data.email) data.email = normalizeEmail(data.email);

  const previousRole = existing.employmentType;
  const newRole = data.employmentType || existing.employmentType;
  const previousShift = existing.assignedShift;
  if (data.shiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: data.shiftId } });
    data.assignedShift = shift?.shiftName || null;
  }
  const employee = await prisma.employeeProfile.update({
    where: { id },
    data
  });

  if (newRole !== previousRole) {
    await prisma.employeeLifecycleHistory.create({
      data: {
        employeeProfileId: id,
        previousRole,
        newRole,
        changedByUserId: req.user.id,
        remarks: "Employment type changed by admin"
      }
    });
  }

  if (data.assignedShift !== undefined && data.assignedShift !== previousShift) {
    await prisma.shiftAssignmentHistory.create({
      data: {
        employeeProfileId: id,
        previousShift,
        newShift: data.assignedShift || "Unassigned",
        changedByUserId: req.user.id,
        remarks: "Shift changed by admin"
      }
    });
  }

  await writeAudit(req, "employee_profile_updated", {
    meta: { employeeProfileId: id, changedFields: Object.keys(data) },
    oldValue: existing,
    newValue: employee
  });

  return res.json({ ok: true, employee });
}

async function deleteEmployeeProfile(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.employeeProfile.findUnique({ where: { id } });
  await prisma.employeeProfile.delete({ where: { id } });
  await writeAudit(req, "employee_profile_deleted", {
    meta: { employeeProfileId: id },
    oldValue: existing
  });
  return res.json({ ok: true });
}

async function getEmployeeSystem(req, res) {
  await ensureDefaultEmployeeSettings();
  const today = getStartOfToday();
  const next30 = new Date(today);
  next30.setDate(next30.getDate() + 30);

  const [
    employees,
    officeLocations,
    departments,
    designations,
    shifts,
    documentCategories,
    leaveRequests,
    attendanceRecords,
    auditLogs
  ] = await Promise.all([
    prisma.employeeProfile.findMany({
      include: {
        officeLocation: true,
        shift: true,
        attendanceRecords: { orderBy: { attendanceDate: "desc" }, take: 20 },
        documents: { orderBy: { createdAt: "desc" }, take: 20 },
        lifecycleHistory: { orderBy: { effectiveDate: "desc" }, take: 20 },
        shiftHistory: { orderBy: { effectiveDate: "desc" }, take: 20 },
        leaveRequests: { orderBy: { createdAt: "desc" }, take: 20 }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.officeLocation.findMany({ orderBy: { officeName: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.designation.findMany({ orderBy: { name: "asc" } }),
    prisma.shift.findMany({ orderBy: { shiftName: "asc" } }),
    prisma.documentCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      include: { employeeProfile: true },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.attendanceRecord.findMany({
      include: { employeeProfile: true, officeLocation: true },
      orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
      take: 300
    }),
    prisma.adminAuditLog.findMany({
      include: { actor: { select: { email: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 300
    })
  ]);

  const todayAttendance = attendanceRecords.filter((record) => new Date(record.attendanceDate).toDateString() === today.toDateString());
  const presentIds = new Set(todayAttendance.filter((record) => record.checkInAt).map((record) => record.employeeProfileId));
  const dashboard = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((employee) => employee.employmentStatus === "Active").length,
    interns: employees.filter((employee) => employee.employmentType === "Intern").length,
    paidInterns: employees.filter((employee) => employee.employmentType === "Paid Intern").length,
    maintenanceStaff: employees.filter((employee) => employee.employmentType === "Maintenance Staff").length,
    todayAttendance: todayAttendance.length,
    presentEmployees: presentIds.size,
    absentEmployees: Math.max(0, employees.filter((employee) => employee.employmentStatus === "Active").length - presentIds.size),
    lateArrivals: todayAttendance.filter((record) => record.lateMinutes > 0 || record.status === "Late Arrival").length,
    employeesOnLeave: leaveRequests.filter((leave) => leave.status === "Approved" && leave.startDate <= today && leave.endDate >= today).length,
    newJoiners: employees.filter((employee) => employee.dateOfJoining && employee.dateOfJoining >= today).length,
    upcomingRelievingEmployees: employees.filter((employee) => employee.dateOfRelieving && employee.dateOfRelieving >= today && employee.dateOfRelieving <= next30).length
  };

  return res.json({
    employees,
    officeLocations,
    departments,
    designations,
    shifts,
    documentCategories,
    leaveRequests,
    attendanceRecords,
    auditLogs,
    dashboard
  });
}

async function createOfficeLocation(req, res) {
  const office = await prisma.officeLocation.create({ data: req.validatedBody });
  await writeAudit(req, "office_location_created", { newValue: office });
  return res.status(201).json({ ok: true, office });
}

async function updateOfficeLocation(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.officeLocation.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, "Office location not found");
  const office = await prisma.officeLocation.update({ where: { id }, data: req.validatedBody });
  await writeAudit(req, "office_location_updated", { oldValue: existing, newValue: office });
  return res.json({ ok: true, office });
}

async function deleteOfficeLocation(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.officeLocation.findUnique({ where: { id } });
  await prisma.officeLocation.delete({ where: { id } });
  await writeAudit(req, "office_location_deleted", { oldValue: existing });
  return res.json({ ok: true });
}

function getNamedModel(kind) {
  if (kind === "departments") return { model: prisma.department, label: "department" };
  if (kind === "designations") return { model: prisma.designation, label: "designation" };
  if (kind === "document-categories") return { model: prisma.documentCategory, label: "document_category" };
  return null;
}

async function createNamedSetting(req, res) {
  const target = getNamedModel(req.params.kind);
  if (!target) throw createHttpError(404, "Setting type not found");
  const data = req.params.kind === "designations"
    ? req.validatedBody
    : { name: req.validatedBody.name, isActive: req.validatedBody.isActive ?? true };
  const item = await target.model.create({ data });
  await writeAudit(req, `${target.label}_created`, { newValue: item });
  return res.status(201).json({ ok: true, item });
}

async function updateNamedSetting(req, res) {
  const target = getNamedModel(req.params.kind);
  if (!target) throw createHttpError(404, "Setting type not found");
  const { id } = req.validatedParams;
  const existing = await target.model.findUnique({ where: { id } });
  const data = req.params.kind === "designations"
    ? req.validatedBody
    : { name: req.validatedBody.name, isActive: req.validatedBody.isActive ?? true };
  const item = await target.model.update({ where: { id }, data });
  await writeAudit(req, `${target.label}_updated`, { oldValue: existing, newValue: item });
  return res.json({ ok: true, item });
}

async function deleteNamedSetting(req, res) {
  const target = getNamedModel(req.params.kind);
  if (!target) throw createHttpError(404, "Setting type not found");
  const { id } = req.validatedParams;
  const existing = await target.model.findUnique({ where: { id } });
  await target.model.delete({ where: { id } });
  await writeAudit(req, `${target.label}_deleted`, { oldValue: existing });
  return res.json({ ok: true });
}

async function createShift(req, res) {
  const shift = await prisma.shift.create({ data: req.validatedBody });
  await writeAudit(req, "shift_created", { newValue: shift });
  return res.status(201).json({ ok: true, shift });
}

async function updateShift(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.shift.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, "Shift not found");
  const shift = await prisma.shift.update({ where: { id }, data: req.validatedBody });
  await writeAudit(req, "shift_updated", { oldValue: existing, newValue: shift });
  return res.json({ ok: true, shift });
}

async function deleteShift(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.shift.findUnique({ where: { id } });
  await prisma.shift.delete({ where: { id } });
  await writeAudit(req, "shift_deleted", { oldValue: existing });
  return res.json({ ok: true });
}

async function createManualAttendance(req, res) {
  const body = req.validatedBody;
  const computed = await calculateAttendance(body.employeeProfileId, body);
  const attendance = await prisma.attendanceRecord.upsert({
    where: {
      employeeProfileId_attendanceDate: {
        employeeProfileId: body.employeeProfileId,
        attendanceDate: body.attendanceDate
      }
    },
    update: {
      officeLocationId: body.officeLocationId || null,
      checkInAt: body.checkInAt || null,
      checkOutAt: body.checkOutAt || null,
      remarks: body.remarks || body.reason,
      isManual: true,
      ...computed
    },
    create: {
      employeeProfileId: body.employeeProfileId,
      officeLocationId: body.officeLocationId || null,
      attendanceDate: body.attendanceDate,
      checkInAt: body.checkInAt || null,
      checkOutAt: body.checkOutAt || null,
      remarks: body.remarks || body.reason,
      isManual: true,
      ...computed
    }
  });
  await writeAudit(req, "attendance_manual_entry", { meta: { reason: body.reason }, newValue: attendance });
  return res.status(201).json({ ok: true, attendance });
}

async function updateAttendanceRecord(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.attendanceRecord.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, "Attendance record not found");
  const body = req.validatedBody;
  const nextData = {
    officeLocationId: body.officeLocationId ?? existing.officeLocationId,
    attendanceDate: body.attendanceDate ?? existing.attendanceDate,
    checkInAt: body.checkInAt === undefined ? existing.checkInAt : body.checkInAt,
    checkOutAt: body.checkOutAt === undefined ? existing.checkOutAt : body.checkOutAt,
    status: body.status ?? existing.status,
    remarks: body.remarks ?? existing.remarks,
    isManual: true
  };
  const computed = await calculateAttendance(existing.employeeProfileId, nextData);
  const attendance = await prisma.attendanceRecord.update({
    where: { id },
    data: { ...nextData, ...computed }
  });
  await writeAudit(req, "attendance_edited", { meta: { reason: body.reason }, oldValue: existing, newValue: attendance });
  return res.json({ ok: true, attendance });
}

async function deleteAttendanceRecord(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.attendanceRecord.findUnique({ where: { id } });
  await prisma.attendanceRecord.delete({ where: { id } });
  await writeAudit(req, "attendance_deleted", { oldValue: existing });
  return res.json({ ok: true });
}

async function updateLeaveStatus(req, res) {
  const { id } = req.validatedParams;
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) throw createHttpError(404, "Leave request not found");
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: req.validatedBody.status,
      reviewRemarks: req.validatedBody.reviewRemarks || null,
      reviewedAt: new Date(),
      reviewedByUserId: req.user.id
    }
  });
  await writeAudit(req, `leave_${req.validatedBody.status.toLowerCase()}`, { oldValue: existing, newValue: leave });
  return res.json({ ok: true, leave });
}

async function getAttendanceExport(req, res) {
  const records = await prisma.attendanceRecord.findMany({
    include: { employeeProfile: true, officeLocation: true },
    orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
    take: 5000
  });

  const headers = ["Date", "Employee ID", "Name", "Email", "Department", "Shift", "Office", "Check In", "Check Out", "Status", "Late Minutes", "Early Departure", "Overtime", "Working Minutes"];
  const rows = records.map((record) => [
    new Date(record.attendanceDate).toLocaleDateString(),
    record.employeeProfile.employeeId,
    record.employeeProfile.fullName,
    record.employeeProfile.email,
    record.employeeProfile.department || "",
    record.employeeProfile.assignedShift || "",
    record.officeLocation?.officeName || "",
    record.checkInAt ? new Date(record.checkInAt).toLocaleString() : "",
    record.checkOutAt ? new Date(record.checkOutAt).toLocaleString() : "",
    record.status,
    record.lateMinutes,
    record.earlyDepartureMinutes,
    record.overtimeMinutes,
    record.totalWorkingMinutes
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=attendance-report.csv");
  return res.send(csv);
}

async function createCourse(req, res) {
  const course = await prisma.course.create({
    data: req.validatedBody
  });
  return res.status(201).json({ ok: true, course });
}

async function getCourses(req, res) {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" }
  });
  return res.json({ courses });
}

async function updateCourse(req, res) {
  const { id } = req.validatedParams;
  const course = await prisma.course.update({
    where: { id },
    data: req.validatedBody
  });
  return res.json({ ok: true, course });
}

async function duplicateCourse(req, res) {
  const { id } = req.validatedParams;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw createHttpError(404, "Course not found");

  const copy = await prisma.course.create({
    data: {
      title: `${course.title} (Copy)`,
      description: course.description,
      price: course.price,
      duration: course.duration,
      category: course.category,
      features: course.features,
      isActive: course.isActive,
      sortOrder: course.sortOrder + 1
    }
  });

  return res.status(201).json({ ok: true, course: copy });
}

async function deleteCourse(req, res) {
  const { id } = req.validatedParams;
  await prisma.course.delete({ where: { id } });
  return res.json({ ok: true });
}

async function uploadCourseImage(req, res) {
  // multer will attach file on req.file and key on req.body.key
  const file = req.file;
  const key = req.body?.key ? String(req.body.key).trim() : null;
  if (!file) throw createHttpError(400, "No file uploaded");

  const mediaDir = path.resolve(process.cwd(), "public", "media");
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

  const ext = path.extname(file.originalname) || ".png";
  const baseName = key ? key.replace(/[^a-zA-Z0-9_\-]/g, "_") : path.basename(file.originalname, ext);
  const filename = `${baseName}${ext}`;
  const destPath = path.join(mediaDir, filename);

  // Move uploaded file from tmp to public/media
  fs.renameSync(file.path, destPath);

  const url = `/media/${filename}`;
  return res.json({ ok: true, filename, url, key: baseName });
}

async function seedDefaultCourses(req, res) {
  const existingCount = await prisma.course.count();
  if (existingCount > 0) {
    return res.json({ ok: true, seeded: false, reason: "Courses already exist" });
  }

  const defaults = [
    {
      title: "Basic Drone Program",
      description: "Drone fundamentals, basic building, components understanding, flight basics.",
      price: 5000,
      duration: "24 Hours",
      category: "basic",
      features: ["Drone fundamentals", "Basic drone building", "Components understanding", "Flight basics"],
      images: ["B1", "B2", "B3"],
      sortOrder: 10,
      isActive: true
    },
    {
      title: "Fixed Wing Drone",
      description: "Fixed wing design, aerodynamics basics, assembly and testing, flight control concepts.",
      price: 10000,
      duration: "40 Hours",
      category: "moderate",
      features: ["Fixed wing drone design", "Aerodynamics basics", "Assembly & testing", "Flight control concepts"],
      images: ["F1", "F2", "F3"],
      sortOrder: 20,
      isActive: true
    },
    {
      title: "Multicopter Drone",
      description: "Multicopter design, lift & propulsion basics, assembly and testing, flight control concepts.",
      price: 10000,
      duration: "40 Hours",
      category: "moderate",
      features: ["Multicopter drone design", "Lift & propulsion basics", "Assembly & testing", "Flight control concepts"],
      images: ["M1", "M2", "M3"],
      sortOrder: 30,
      isActive: true
    },
    {
      title: "AI in Drone",
      description: "AI fundamentals in drones, computer vision basics, autonomous flight concepts, applications.",
      price: 10000,
      duration: "40 Hours",
      category: "moderate",
      features: ["AI fundamentals in drones", "Computer vision basics", "Autonomous flight concepts", "Real-world applications"],
      images: ["A1", "A2"],
      sortOrder: 40,
      isActive: true
    },
    {
      title: "Frame Designing for UAVs",
      description: "Specialized training for advanced design workflows and long-term UAV frame design.",
      price: 25000,
      duration: "12 months",
      category: "advance",
      features: ["Frame design fundamentals", "Material selection", "Strength & stability considerations", "Design validation workflow"],
      images: ["FD1", "FD2", "FD3"],
      sortOrder: 50,
      isActive: true
    }
  ];

  const created = await prisma.course.createMany({ data: defaults });
  return res.json({ ok: true, seeded: true, created: created.count });
}

async function getEnrollments(req, res) {
  const { course, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (course) {
    where.courseName = { contains: course, mode: 'insensitive' };
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: parseInt(limit),
    select: {
      id: true,
      userEmail: true,
      billingName: true,
      billingPhone: true,
      firstName: true,
      lastName: true,
      gender: true,
      email: true,
      dateOfBirth: true,
      city: true,
      state: true,
      preferredBatch: true,
      experienceLevel: true,
      profession: true,
      college: true,
      agreedToFollowUp: true,
      courseName: true,
      orderId: true,
      paymentId: true,
      amountPaise: true,
      currency: true,
      status: true,
      createdAt: true,
      paidAt: true,
      paymentReceived: true
    }
  });

  const total = await prisma.courseEnrollment.count({ where });

  res.json({
    enrollments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function updatePaymentReceived(req, res) {
  const { id } = req.validatedParams;
  const { paymentReceived } = req.validatedBody;

  const enrollment = await prisma.courseEnrollment.update({
    where: { id },
    data: { paymentReceived: Boolean(paymentReceived) },
    select: {
      id: true,
      paymentReceived: true,
      courseName: true,
      billingName: true
    }
  });

  return res.json({ ok: true, enrollment });
}

async function exportEnrollments(req, res) {
  const { course } = req.query;

  const where = {};
  if (course) {
    where.courseName = { contains: course, mode: 'insensitive' };
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      userEmail: true,
      billingName: true,
      billingPhone: true,
      firstName: true,
      lastName: true,
      gender: true,
      email: true,
      dateOfBirth: true,
      city: true,
      state: true,
      preferredBatch: true,
      experienceLevel: true,
      profession: true,
      college: true,
      agreedToFollowUp: true,
      courseName: true,
      orderId: true,
      paymentId: true,
      amountPaise: true,
      currency: true,
      status: true,
      createdAt: true,
      paidAt: true,
      paymentReceived: true
    }
  });

  // Convert to CSV
  const csvHeaders = [
    'User Email',
    'Billing Name',
    'First Name',
    'Last Name',
    'Gender',
    'Mobile',
    'Email',
    'Date of Birth',
    'City',
    'State',
    'Preferred Batch',
    'Experience Level',
    'Profession',
    'College',
    'Agreed to Follow-up',
    'Course Name',
    'Order ID',
    'Payment ID',
    'Amount (Paise)',
    'Currency',
    'Status',
    'Created At',
    'Paid At',
    'Payment Received'
  ];

  const csvRows = enrollments.map(enrollment => [
    enrollment.userEmail || '',
    enrollment.billingName || '',
    enrollment.firstName || '',
    enrollment.lastName || '',
    enrollment.gender || '',
    enrollment.billingPhone || '',
    enrollment.email || '',
    enrollment.dateOfBirth ? new Date(enrollment.dateOfBirth).toLocaleDateString() : '',
    enrollment.city || '',
    enrollment.state || '',
    enrollment.preferredBatch || '',
    enrollment.experienceLevel || '',
    enrollment.profession || '',
    enrollment.college || '',
    enrollment.agreedToFollowUp ? 'Yes' : 'No',
    enrollment.courseName,
    enrollment.orderId,
    enrollment.paymentId || '',
    enrollment.amountPaise,
    enrollment.currency,
    enrollment.status,
    new Date(enrollment.createdAt).toLocaleString(),
    enrollment.paidAt ? new Date(enrollment.paidAt).toLocaleString() : '',
    enrollment.paymentReceived ? 'Yes' : 'No'
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=enrollments.csv');
  res.send(csvContent);
}

async function getPaymentAttempts(req, res) {
  const { status, failureStage, failureReason, orderId, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = String(status);
  if (orderId) where.orderId = { contains: String(orderId) };
  if (failureStage) where.failureStage = { contains: String(failureStage), mode: "insensitive" };
  if (failureReason) where.failureReason = { contains: String(failureReason), mode: "insensitive" };

  const attempts = await prisma.coursePaymentAttempt.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit),
    select: {
      id: true,
      orderId: true,
      paymentId: true,
      userEmail: true,
      billingName: true,
      billingPhone: true,
      courseName: true,
      amountPaise: true,
      currency: true,
      status: true,
      failureStage: true,
      failureReason: true,
      createdAt: true,
      updatedAt: true,
      paidAt: true,
      failedAt: true,
      cancelledAt: true
    }
  });

  const total = await prisma.coursePaymentAttempt.count({ where });
  return res.json({
    attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function exportPaymentAttempts(req, res) {
  const { status, failureStage, failureReason, orderId } = req.query;
  const where = {};
  if (status) where.status = String(status);
  if (orderId) where.orderId = { contains: String(orderId) };
  if (failureStage) where.failureStage = { contains: String(failureStage), mode: "insensitive" };
  if (failureReason) where.failureReason = { contains: String(failureReason), mode: "insensitive" };

  const attempts = await prisma.coursePaymentAttempt.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      orderId: true,
      paymentId: true,
      userEmail: true,
      billingName: true,
      billingPhone: true,
      courseName: true,
      amountPaise: true,
      currency: true,
      status: true,
      failureStage: true,
      failureReason: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const csvHeaders = [
    "Order ID",
    "Payment ID",
    "User Email",
    "Billing Name",
    "Billing Phone",
    "Course",
    "Amount (Paise)",
    "Currency",
    "Status",
    "Failure Stage",
    "Failure Reason",
    "Created At",
    "Updated At"
  ];

  const csvRows = attempts.map((a) => [
    a.orderId || "",
    a.paymentId || "",
    a.userEmail || "",
    a.billingName || "",
    a.billingPhone || "",
    a.courseName || "",
    a.amountPaise ?? "",
    a.currency || "",
    a.status,
    a.failureStage || "",
    a.failureReason || "",
    new Date(a.createdAt).toLocaleString(),
    new Date(a.updatedAt).toLocaleString()
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=payment_attempts.csv");
  res.send(csvContent);
}

async function getEnrollmentDetail(req, res) {
  const { id } = req.validatedParams;
  const enrollment = await prisma.courseEnrollment.findUnique({ where: { id } });
  if (!enrollment) throw createHttpError(404, "Enrollment not found");
  return res.json({ enrollment });
}

async function updateEnrollment(req, res) {
  const { id } = req.validatedParams;
  const enrollment = await prisma.courseEnrollment.update({
    where: { id },
    data: req.validatedBody
  });
  return res.json({ ok: true, enrollment });
}

async function resendEnrollmentInvoice(req, res) {
  const { id } = req.validatedParams;
  const enrollment = await prisma.courseEnrollment.findUnique({ where: { id } });
  if (!enrollment) throw createHttpError(404, "Enrollment not found");

  const to = enrollment.email || enrollment.userEmail || null;
  if (!to) throw createHttpError(400, "No email available for this enrollment");

  const amountInr = (Number(enrollment.amountPaise || 0) / 100).toFixed(2);
  await sendMail({
    to,
    subject: "Rigvaimaniki Course Registration - Invoice",
    text: [
      "Your course invoice is below:",
      "",
      `Course: ${enrollment.courseName}`,
      ...(enrollment.billingName ? [`Name: ${enrollment.billingName}`] : []),
      ...(enrollment.billingPhone ? [`Mobile: ${enrollment.billingPhone}`] : []),
      ...(enrollment.orderId ? [`Order ID: ${enrollment.orderId}`] : []),
      ...(enrollment.paymentId ? [`Payment ID: ${enrollment.paymentId}`] : []),
      `Amount: INR ${amountInr}`,
      "",
      "Thank you for choosing Rigvaimaniki Technologies!"
    ].join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 12px">Course Invoice</h2>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#555">Course</td><td style="padding:6px 16px;font-weight:700">${enrollment.courseName}</td></tr>
          ${enrollment.billingName ? `<tr><td style="padding:6px 0;color:#555">Name</td><td style="padding:6px 16px">${enrollment.billingName}</td></tr>` : ""}
          ${enrollment.billingPhone ? `<tr><td style="padding:6px 0;color:#555">Mobile</td><td style="padding:6px 16px">${enrollment.billingPhone}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#555">Order ID</td><td style="padding:6px 16px">${enrollment.orderId}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Payment ID</td><td style="padding:6px 16px">${enrollment.paymentId || "-"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Amount</td><td style="padding:6px 16px;font-weight:700">INR ${amountInr}</td></tr>
        </table>
        <p style="margin:16px 0 0">Thank you for choosing Rigvaimaniki Technologies!</p>
      </div>
    `
  });

  return res.json({ ok: true, sent: true });
}

module.exports = {
  getUsers,
  updateUserRole,
  updateUserVerification,
  deleteUser,
  getLoginEvents,
  getEmployeeProfiles,
  createEmployeeProfile,
  updateEmployeeProfile,
  deleteEmployeeProfile,
  getEmployeeSystem,
  createOfficeLocation,
  updateOfficeLocation,
  deleteOfficeLocation,
  createNamedSetting,
  updateNamedSetting,
  deleteNamedSetting,
  createShift,
  updateShift,
  deleteShift,
  createManualAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  updateLeaveStatus,
  getAttendanceExport,
  createCourse,
  getCourses,
  updateCourse,
  duplicateCourse,
  deleteCourse,
  seedDefaultCourses,
  getEnrollments,
  getEnrollmentDetail,
  updateEnrollment,
  resendEnrollmentInvoice,
  uploadCourseImage,
  updatePaymentReceived,
  exportEnrollments,
  getPaymentAttempts,
  exportPaymentAttempts
};
