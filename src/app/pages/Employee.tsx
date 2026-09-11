import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CalendarCheck, Check, Download, FileUp, LogIn, LogOut, MapPin, Plus, RefreshCw, Save, ShieldCheck, X } from "lucide-react";
import { API_BASE, api } from "@/app/lib/api";
import { useAuth } from "@/app/contexts/AuthContext";

type OfficeLocation = {
  id: string;
  officeName: string;
  officeAddress: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  isActive: boolean;
};

type SettingItem = {
  id: string;
  name: string;
  groupName?: string | null;
  isActive: boolean;
};

type Shift = {
  id: string;
  shiftName: string;
  startTime: string | null;
  endTime: string | null;
  requiredWorkingMinutes: number | null;
  gracePeriodMinutes: number;
  breakDurationMinutes: number;
  overtimeThresholdMinutes: number;
  weeklyOffDays: string[];
  isFlexible: boolean;
  isActive: boolean;
};

type AttendanceRecord = {
  id: string;
  employeeProfileId: string;
  attendanceDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: string;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
  totalWorkingMinutes: number;
  remarks?: string | null;
  employeeProfile?: EmployeeProfile;
  officeLocation?: OfficeLocation | null;
};

type EmployeeDocument = {
  id: string;
  category: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

type LeaveRequest = {
  id: string;
  employeeProfileId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  reviewRemarks?: string | null;
  employeeProfile?: EmployeeProfile;
  createdAt: string;
};

type EmployeeProfile = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string | null;
  department: string | null;
  designation: string | null;
  reportingManager: string | null;
  assignedShift: string | null;
  officeLocationId?: string | null;
  shiftId?: string | null;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string | null;
  dateOfRelieving?: string | null;
  collegeName: string | null;
  universityName: string | null;
  mentorAssigned: string | null;
  attendanceRecords?: AttendanceRecord[];
  documents?: EmployeeDocument[];
  leaveRequests?: LeaveRequest[];
  lifecycleHistory?: Array<{ id: string; previousRole: string | null; newRole: string; effectiveDate: string; remarks: string | null }>;
  shiftHistory?: Array<{ id: string; previousShift: string | null; newShift: string; effectiveDate: string; remarks: string | null }>;
  officeLocation?: OfficeLocation | null;
  shift?: Shift | null;
};

type EmployeeSystem = {
  employees: EmployeeProfile[];
  officeLocations: OfficeLocation[];
  departments: SettingItem[];
  designations: SettingItem[];
  shifts: Shift[];
  documentCategories: SettingItem[];
  leaveRequests: LeaveRequest[];
  attendanceRecords: AttendanceRecord[];
  auditLogs: Array<{ id: string; action: string; createdAt: string; ip: string | null; actor?: { email: string; role: string }; oldValue?: any; newValue?: any; meta?: any }>;
  dashboard: Record<string, number>;
};

const emptySystem: EmployeeSystem = {
  employees: [],
  officeLocations: [],
  departments: [],
  designations: [],
  shifts: [],
  documentCategories: [],
  leaveRequests: [],
  attendanceRecords: [],
  auditLogs: [],
  dashboard: {}
};

const initialDraft = {
  fullName: "",
  email: "",
  mobileNumber: "",
  department: "",
  designation: "",
  officeLocationId: "",
  shiftId: "",
  employmentType: "Full-Time Employee",
  employmentStatus: "Active",
  collegeName: "",
  universityName: "",
  studentId: "",
  internshipStartDate: "",
  internshipEndDate: "",
  stipendAmount: ""
};

const employmentTypes = ["Intern", "Paid Intern", "Part-Time Employee", "Full-Time Employee", "Team Lead", "Manager", "HR", "CMO", "Director", "Admin", "Maintenance Staff"];
const employmentStatuses = ["Active", "On Leave", "Resigned", "Relieved", "Terminated", "Internship Completed"];
const leaveTypes = ["Casual Leave", "Sick Leave", "Emergency Leave", "Work From Home", "Paid Leave", "Unpaid Leave"];

function shortDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function shortDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function dateTimeInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function Employee() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ["admin", "super_admin"].includes(user?.role || "");
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [system, setSystem] = useState<EmployeeSystem>(emptySystem);
  const [draft, setDraft] = useState(initialDraft);
  const [editDrafts, setEditDrafts] = useState<Record<string, Partial<EmployeeProfile>>>({});
  const [officeDraft, setOfficeDraft] = useState({ officeName: "", officeAddress: "", latitude: "26.2389", longitude: "73.0243", allowedRadiusMeters: "100" });
  const [settingDrafts, setSettingDrafts] = useState({ departments: "", designations: "", documentCategories: "" });
  const [shiftDraft, setShiftDraft] = useState({ shiftName: "", startTime: "09:00", endTime: "18:00", gracePeriodMinutes: "15", breakDurationMinutes: "60", overtimeThresholdMinutes: "30", weeklyOffDays: "Sunday", isFlexible: false, requiredWorkingMinutes: "" });
  const [manualAttendance, setManualAttendance] = useState({ employeeProfileId: "", officeLocationId: "", attendanceDate: new Date().toISOString().slice(0, 10), checkInAt: "", checkOutAt: "", status: "Present", reason: "" });
  const [documentCategory, setDocumentCategory] = useState("Aadhaar");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [leaveDraft, setLeaveDraft] = useState({ leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offices = isAdmin ? system.officeLocations : (employee as any)?.officeLocations || system.officeLocations;
  const documentCategories = isAdmin ? system.documentCategories : (employee as any)?.documentCategories || system.documentCategories;

  const todayAttendance = useMemo(() => {
    if (!employee?.attendanceRecords?.length) return null;
    const today = new Date().toDateString();
    return employee.attendanceRecords.find((record) => new Date(record.attendanceDate).toDateString() === today) || null;
  }, [employee?.attendanceRecords]);

  useEffect(() => {
    void loadEmployeeArea();
  }, [isAdmin]);

  async function loadEmployeeArea() {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const res = await api<EmployeeSystem>("/admin/employee-system");
        setSystem(res);
        setManualAttendance((prev) => ({
          ...prev,
          employeeProfileId: prev.employeeProfileId || res.employees[0]?.id || "",
          officeLocationId: prev.officeLocationId || res.officeLocations[0]?.id || ""
        }));
      } else {
        const res = await api<{ employee: EmployeeProfile; officeLocations: OfficeLocation[]; documentCategories: SettingItem[] }>("/employee/me");
        setEmployee({ ...(res.employee as any), officeLocations: res.officeLocations, documentCategories: res.documentCategories });
        setSelectedOfficeId(res.employee.officeLocationId || res.officeLocations[0]?.id || "");
        setDocumentCategory(res.documentCategories[0]?.name || "Aadhaar");
      }
    } catch {
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function createEmployee() {
    setBusy(true);
    setError(null);
    try {
      await api("/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          email: draft.email.trim().toLowerCase(),
          mobileNumber: draft.mobileNumber || null,
          department: draft.department || null,
          designation: draft.designation || null,
          officeLocationId: draft.officeLocationId || null,
          shiftId: draft.shiftId || null,
          collegeName: draft.collegeName || null,
          universityName: draft.universityName || null,
          studentId: draft.studentId || null,
          internshipStartDate: draft.internshipStartDate || null,
          internshipEndDate: draft.internshipEndDate || null,
          stipendAmount: draft.stipendAmount ? Number(draft.stipendAmount) : null
        })
      });
      setDraft(initialDraft);
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to create employee record");
    } finally {
      setBusy(false);
    }
  }

  async function saveEmployee(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDrafts[id] || {})
      });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to update employee record");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEmployee(id: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/employees/${id}`, { method: "DELETE" });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to delete employee record");
    } finally {
      setBusy(false);
    }
  }

  async function createOffice() {
    setBusy(true);
    setError(null);
    try {
      await api("/admin/office-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...officeDraft,
          latitude: Number(officeDraft.latitude),
          longitude: Number(officeDraft.longitude),
          allowedRadiusMeters: Number(officeDraft.allowedRadiusMeters)
        })
      });
      setOfficeDraft({ officeName: "", officeAddress: "", latitude: "26.2389", longitude: "73.0243", allowedRadiusMeters: "100" });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to create office");
    } finally {
      setBusy(false);
    }
  }

  async function createSetting(kind: "departments" | "designations" | "document-categories", value: string) {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/settings/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value.trim() })
      });
      setSettingDrafts((prev) => ({ ...prev, [kind === "document-categories" ? "documentCategories" : kind]: "" }));
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to create setting");
    } finally {
      setBusy(false);
    }
  }

  async function createShift() {
    setBusy(true);
    setError(null);
    try {
      await api("/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftName: shiftDraft.shiftName,
          startTime: shiftDraft.isFlexible ? null : shiftDraft.startTime,
          endTime: shiftDraft.isFlexible ? null : shiftDraft.endTime,
          requiredWorkingMinutes: shiftDraft.requiredWorkingMinutes ? Number(shiftDraft.requiredWorkingMinutes) : null,
          gracePeriodMinutes: Number(shiftDraft.gracePeriodMinutes || 0),
          breakDurationMinutes: Number(shiftDraft.breakDurationMinutes || 0),
          overtimeThresholdMinutes: Number(shiftDraft.overtimeThresholdMinutes || 0),
          weeklyOffDays: shiftDraft.weeklyOffDays.split(",").map((day) => day.trim()).filter(Boolean),
          isFlexible: shiftDraft.isFlexible
        })
      });
      setShiftDraft({ shiftName: "", startTime: "09:00", endTime: "18:00", gracePeriodMinutes: "15", breakDurationMinutes: "60", overtimeThresholdMinutes: "30", weeklyOffDays: "Sunday", isFlexible: false, requiredWorkingMinutes: "" });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to create shift");
    } finally {
      setBusy(false);
    }
  }

  async function markAttendance(action: "check_in" | "check_out") {
    setBusy(true);
    setError(null);

    if (!selectedOfficeId) {
      setBusy(false);
      setError("Select an office location before marking attendance");
      return;
    }

    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    if (!position) {
      setBusy(false);
      setError("Location permission is required. Attendance was not marked.");
      return;
    }

    try {
      await api("/employee/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          officeLocationId: selectedOfficeId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to mark attendance");
    } finally {
      setBusy(false);
    }
  }

  async function saveManualAttendance() {
    setBusy(true);
    setError(null);
    try {
      const date = manualAttendance.attendanceDate;
      await api("/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeProfileId: manualAttendance.employeeProfileId,
          officeLocationId: manualAttendance.officeLocationId || null,
          attendanceDate: new Date(`${date}T00:00:00`),
          checkInAt: manualAttendance.checkInAt ? new Date(manualAttendance.checkInAt) : null,
          checkOutAt: manualAttendance.checkOutAt ? new Date(manualAttendance.checkOutAt) : null,
          status: manualAttendance.status,
          reason: manualAttendance.reason || "Manual attendance correction"
        })
      });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to save attendance");
    } finally {
      setBusy(false);
    }
  }

  async function reviewLeave(id: string, status: "Approved" | "Rejected" | "Cancelled") {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to update leave request");
    } finally {
      setBusy(false);
    }
  }

  async function applyLeave() {
    setBusy(true);
    setError(null);
    try {
      await api("/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveDraft)
      });
      setLeaveDraft({ leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" });
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Failed to apply for leave");
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument() {
    if (!documentFile) {
      setError("Choose a document first");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("category", documentCategory);
      form.append("file", documentFile);

      const res = await fetch(`${API_BASE}/employee/documents`, {
        method: "POST",
        credentials: "include",
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Document upload failed");

      setDocumentFile(null);
      await loadEmployeeArea();
    } catch (err: any) {
      setError(err?.message || "Document upload failed");
    } finally {
      setBusy(false);
    }
  }

  function exportAttendance() {
    window.location.href = `${API_BASE}/admin/employee-system/export-attendance`;
  }

  if (!user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6 text-neutral-600">
        Loading employee system...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 pb-16 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Employee System</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {isAdmin ? "Lifecycle, attendance, leave, documents, shifts, and audit control." : employee?.email}
            </p>
          </div>
          <button type="button" onClick={() => void loadEmployeeArea()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm disabled:opacity-50 dark:bg-neutral-900 dark:border-neutral-700" disabled={busy}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {isAdmin ? (
          <>
            <div className="flex flex-wrap gap-2">
              {["dashboard", "employees", "attendance", "leaves", "settings", "documents", "audit"].map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-lg border text-sm capitalize ${activeTab === tab ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950" : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "dashboard" && (
              <section className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {[
                    ["Total", system.dashboard.totalEmployees],
                    ["Active", system.dashboard.activeEmployees],
                    ["Interns", system.dashboard.interns],
                    ["Paid Interns", system.dashboard.paidInterns],
                    ["Present Today", system.dashboard.presentEmployees],
                    ["Absent", system.dashboard.absentEmployees],
                    ["Late", system.dashboard.lateArrivals],
                    ["On Leave", system.dashboard.employeesOnLeave],
                    ["Maintenance", system.dashboard.maintenanceStaff],
                    ["New Joiners", system.dashboard.newJoiners],
                    ["Upcoming Relieving", system.dashboard.upcomingRelievingEmployees]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-neutral-200 bg-white p-4 dark:bg-neutral-900 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500">{label}</div>
                      <div className="mt-1 text-2xl font-semibold">{Number(value || 0)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "employees" && (
              <section className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
                  <h2 className="text-xl font-semibold mb-4">Add Employee / Intern</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Full name" value={draft.fullName} onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Email" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Mobile" value={draft.mobileNumber} onChange={(e) => setDraft((p) => ({ ...p, mobileNumber: e.target.value }))} />
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.employmentType} onChange={(e) => setDraft((p) => ({ ...p, employmentType: e.target.value }))}>{employmentTypes.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.department} onChange={(e) => setDraft((p) => ({ ...p, department: e.target.value }))}><option value="">Department</option>{system.departments.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.designation} onChange={(e) => setDraft((p) => ({ ...p, designation: e.target.value }))}><option value="">Designation</option>{system.designations.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.officeLocationId} onChange={(e) => setDraft((p) => ({ ...p, officeLocationId: e.target.value }))}><option value="">Office</option>{system.officeLocations.map((item) => <option key={item.id} value={item.id}>{item.officeName}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.shiftId} onChange={(e) => setDraft((p) => ({ ...p, shiftId: e.target.value }))}><option value="">Shift</option>{system.shifts.map((item) => <option key={item.id} value={item.id}>{item.shiftName}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={draft.employmentStatus} onChange={(e) => setDraft((p) => ({ ...p, employmentStatus: e.target.value }))}>{employmentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="College" value={draft.collegeName} onChange={(e) => setDraft((p) => ({ ...p, collegeName: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="University" value={draft.universityName} onChange={(e) => setDraft((p) => ({ ...p, universityName: e.target.value }))} />
                    <button type="button" onClick={() => void createEmployee()} disabled={busy} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"><Plus size={16} />Create</button>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left border-b"><th className="py-3 pr-3">ID</th><th className="py-3 pr-3">Name</th><th className="py-3 pr-3">Email</th><th className="py-3 pr-3">Department</th><th className="py-3 pr-3">Designation</th><th className="py-3 pr-3">Shift</th><th className="py-3">Actions</th></tr></thead>
                    <tbody>
                      {system.employees.map((item) => {
                        const patch = editDrafts[item.id] || {};
                        return (
                          <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                            <td className="py-3 pr-3">{item.employeeId}</td>
                            <td className="py-3 pr-3">{item.fullName}</td>
                            <td className="py-3 pr-3">{item.email}</td>
                            <td className="py-3 pr-3"><select className="px-2 py-1 rounded border bg-transparent" value={(patch.department as string) ?? item.department ?? ""} onChange={(e) => setEditDrafts((p) => ({ ...p, [item.id]: { ...(p[item.id] || {}), department: e.target.value } }))}><option value="">-</option>{system.departments.map((d) => <option key={d.id}>{d.name}</option>)}</select></td>
                            <td className="py-3 pr-3"><select className="px-2 py-1 rounded border bg-transparent" value={(patch.designation as string) ?? item.designation ?? ""} onChange={(e) => setEditDrafts((p) => ({ ...p, [item.id]: { ...(p[item.id] || {}), designation: e.target.value } }))}><option value="">-</option>{system.designations.map((d) => <option key={d.id}>{d.name}</option>)}</select></td>
                            <td className="py-3 pr-3"><select className="px-2 py-1 rounded border bg-transparent" value={(patch.shiftId as string) ?? item.shiftId ?? ""} onChange={(e) => setEditDrafts((p) => ({ ...p, [item.id]: { ...(p[item.id] || {}), shiftId: e.target.value || null } }))}><option value="">-</option>{system.shifts.map((s) => <option key={s.id} value={s.id}>{s.shiftName}</option>)}</select></td>
                            <td className="py-3 flex gap-2"><button type="button" onClick={() => void saveEmployee(item.id)} className="p-2 rounded border" title="Save"><Save size={16} /></button><button type="button" onClick={() => void deleteEmployee(item.id)} className="p-2 rounded border border-red-300 text-red-700" title="Delete"><X size={16} /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "attendance" && (
              <section className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
                  <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-xl font-semibold">Manual Attendance / Correction</h2><button type="button" onClick={exportAttendance} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"><Download size={16} />Export CSV</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.employeeProfileId} onChange={(e) => setManualAttendance((p) => ({ ...p, employeeProfileId: e.target.value }))}>{system.employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.officeLocationId} onChange={(e) => setManualAttendance((p) => ({ ...p, officeLocationId: e.target.value }))}>{system.officeLocations.map((item) => <option key={item.id} value={item.id}>{item.officeName}</option>)}</select>
                    <input type="date" className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.attendanceDate} onChange={(e) => setManualAttendance((p) => ({ ...p, attendanceDate: e.target.value }))} />
                    <select className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.status} onChange={(e) => setManualAttendance((p) => ({ ...p, status: e.target.value }))}><option>Present</option><option>Absent</option><option>Late Arrival</option><option>Early Departure</option><option>Half Day</option><option>Overtime</option></select>
                    <input type="datetime-local" className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.checkInAt} onChange={(e) => setManualAttendance((p) => ({ ...p, checkInAt: e.target.value }))} />
                    <input type="datetime-local" className="px-3 py-2 rounded-lg border bg-transparent" value={manualAttendance.checkOutAt} onChange={(e) => setManualAttendance((p) => ({ ...p, checkOutAt: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Reason required" value={manualAttendance.reason} onChange={(e) => setManualAttendance((p) => ({ ...p, reason: e.target.value }))} />
                    <button type="button" onClick={() => void saveManualAttendance()} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white"><CalendarCheck size={16} />Save</button>
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
                  <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Date</th><th className="py-3 pr-3">Employee</th><th className="py-3 pr-3">Office</th><th className="py-3 pr-3">In</th><th className="py-3 pr-3">Out</th><th className="py-3 pr-3">Status</th><th className="py-3">Work</th></tr></thead><tbody>{system.attendanceRecords.map((record) => <tr key={record.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{shortDate(record.attendanceDate)}</td><td className="py-3 pr-3">{record.employeeProfile?.fullName}</td><td className="py-3 pr-3">{record.officeLocation?.officeName || "-"}</td><td className="py-3 pr-3">{shortDateTime(record.checkInAt)}</td><td className="py-3 pr-3">{shortDateTime(record.checkOutAt)}</td><td className="py-3 pr-3">{record.status}</td><td className="py-3">{record.totalWorkingMinutes}m</td></tr>)}</tbody></table>
                </div>
              </section>
            )}

            {activeTab === "leaves" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
                <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Employee</th><th className="py-3 pr-3">Type</th><th className="py-3 pr-3">Dates</th><th className="py-3 pr-3">Status</th><th className="py-3">Actions</th></tr></thead><tbody>{system.leaveRequests.map((leave) => <tr key={leave.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{leave.employeeProfile?.fullName}</td><td className="py-3 pr-3">{leave.leaveType}</td><td className="py-3 pr-3">{shortDate(leave.startDate)} - {shortDate(leave.endDate)}</td><td className="py-3 pr-3">{leave.status}</td><td className="py-3 flex gap-2"><button type="button" onClick={() => void reviewLeave(leave.id, "Approved")} className="p-2 rounded border text-green-700"><Check size={16} /></button><button type="button" onClick={() => void reviewLeave(leave.id, "Rejected")} className="p-2 rounded border text-red-700"><X size={16} /></button></td></tr>)}</tbody></table>
              </section>
            )}

            {activeTab === "settings" && (
              <section className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
                  <h2 className="text-xl font-semibold mb-4">Office Locations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Office name" value={officeDraft.officeName} onChange={(e) => setOfficeDraft((p) => ({ ...p, officeName: e.target.value }))} />
                    <input className="md:col-span-2 px-3 py-2 rounded-lg border bg-transparent" placeholder="Address" value={officeDraft.officeAddress} onChange={(e) => setOfficeDraft((p) => ({ ...p, officeAddress: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Latitude" value={officeDraft.latitude} onChange={(e) => setOfficeDraft((p) => ({ ...p, latitude: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Longitude" value={officeDraft.longitude} onChange={(e) => setOfficeDraft((p) => ({ ...p, longitude: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Radius meters" value={officeDraft.allowedRadiusMeters} onChange={(e) => setOfficeDraft((p) => ({ ...p, allowedRadiusMeters: e.target.value }))} />
                    <button type="button" onClick={() => void createOffice()} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white"><MapPin size={16} />Add Office</button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">{system.officeLocations.map((office) => <div key={office.id} className="rounded-lg border p-3 text-sm"><div className="font-medium">{office.officeName}</div><div className="text-neutral-500">{office.latitude}, {office.longitude} | {office.allowedRadiusMeters}m</div></div>)}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[["Departments", "departments", system.departments], ["Designations", "designations", system.designations], ["Document Categories", "document-categories", system.documentCategories]].map(([label, kind, list]) => {
                    const key = kind === "document-categories" ? "documentCategories" : String(kind);
                    return (
                      <div key={String(kind)} className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
                        <h2 className="text-lg font-semibold mb-3">{String(label)}</h2>
                        <div className="flex gap-2"><input className="min-w-0 flex-1 px-3 py-2 rounded-lg border bg-transparent" value={(settingDrafts as any)[key]} onChange={(e) => setSettingDrafts((p) => ({ ...p, [key]: e.target.value }))} /><button type="button" onClick={() => void createSetting(kind as any, (settingDrafts as any)[key])} className="p-2 rounded-lg bg-blue-600 text-white"><Plus size={16} /></button></div>
                        <div className="mt-3 flex flex-wrap gap-2">{(list as SettingItem[]).map((item) => <span key={item.id} className="px-2 py-1 rounded border text-xs">{item.name}</span>)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
                  <h2 className="text-xl font-semibold mb-4">Shifts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Shift name" value={shiftDraft.shiftName} onChange={(e) => setShiftDraft((p) => ({ ...p, shiftName: e.target.value }))} />
                    <input type="time" className="px-3 py-2 rounded-lg border bg-transparent" value={shiftDraft.startTime} onChange={(e) => setShiftDraft((p) => ({ ...p, startTime: e.target.value }))} />
                    <input type="time" className="px-3 py-2 rounded-lg border bg-transparent" value={shiftDraft.endTime} onChange={(e) => setShiftDraft((p) => ({ ...p, endTime: e.target.value }))} />
                    <input className="px-3 py-2 rounded-lg border bg-transparent" placeholder="Grace min" value={shiftDraft.gracePeriodMinutes} onChange={(e) => setShiftDraft((p) => ({ ...p, gracePeriodMinutes: e.target.value }))} />
                    <button type="button" onClick={() => void createShift()} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white"><Plus size={16} />Add Shift</button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">{system.shifts.map((shift) => <div key={shift.id} className="rounded-lg border p-3 text-sm"><div className="font-medium">{shift.shiftName}</div><div className="text-neutral-500">{shift.isFlexible ? `${shift.requiredWorkingMinutes || 480} min flexible` : `${shift.startTime} - ${shift.endTime}`} | grace {shift.gracePeriodMinutes}m</div></div>)}</div>
                </div>
              </section>
            )}

            {activeTab === "documents" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Employee Documents</h2>
                <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Employee</th><th className="py-3 pr-3">Category</th><th className="py-3 pr-3">File</th><th className="py-3">Uploaded</th></tr></thead><tbody>{system.employees.flatMap((emp) => (emp.documents || []).map((doc) => ({ emp, doc }))).map(({ emp, doc }) => <tr key={doc.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{emp.fullName}</td><td className="py-3 pr-3">{doc.category}</td><td className="py-3 pr-3"><a className="text-blue-600" href={`${API_BASE.replace(/\/api$/, "")}${doc.fileUrl}`} target="_blank" rel="noreferrer">{doc.fileName}</a></td><td className="py-3">{shortDateTime(doc.createdAt)}</td></tr>)}</tbody></table>
              </section>
            )}

            {activeTab === "audit" && (
              <section className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
                <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Time</th><th className="py-3 pr-3">User</th><th className="py-3 pr-3">Action</th><th className="py-3">IP</th></tr></thead><tbody>{system.auditLogs.map((log) => <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{shortDateTime(log.createdAt)}</td><td className="py-3 pr-3">{log.actor?.email || "-"}</td><td className="py-3 pr-3">{log.action}</td><td className="py-3">{log.ip || "-"}</td></tr>)}</tbody></table>
              </section>
            )}
          </>
        ) : employee ? (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-green-700"><ShieldCheck size={18} /><span className="text-sm">Verified employee</span></div>
              <h2 className="mt-3 text-xl font-semibold">{employee.fullName}</h2>
              <div className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                <p>{employee.employeeId}</p>
                <p>{employee.employmentType} | {employee.employmentStatus}</p>
                <p>{employee.department || "No department"} | {employee.designation || "No designation"}</p>
                <p>Shift: {employee.assignedShift || "Not assigned"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
              <h2 className="text-xl font-semibold mb-4">Attendance</h2>
              <select value={selectedOfficeId} onChange={(e) => setSelectedOfficeId(e.target.value)} className="mb-3 w-full px-3 py-2 rounded-lg border bg-transparent">
                <option value="">Select office</option>
                {offices.map((office: OfficeLocation) => <option key={office.id} value={office.id}>{office.officeName}</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void markAttendance("check_in")} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"><LogIn size={16} />Check-In</button>
                <button type="button" onClick={() => void markAttendance("check_out")} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"><LogOut size={16} />Check-Out</button>
              </div>
              <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-300">
                <p>Today check-in: {todayAttendance?.checkInAt ? new Date(todayAttendance.checkInAt).toLocaleTimeString() : "-"}</p>
                <p>Today check-out: {todayAttendance?.checkOutAt ? new Date(todayAttendance.checkOutAt).toLocaleTimeString() : "-"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <div className="space-y-3">
                <select value={documentCategory} onChange={(e) => setDocumentCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-transparent">{documentCategories.map((category: SettingItem) => <option key={category.id}>{category.name}</option>)}</select>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                <button type="button" onClick={() => void uploadDocument()} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"><FileUp size={16} />Upload</button>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800">
              <h2 className="text-xl font-semibold mb-4">Apply Leave</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select value={leaveDraft.leaveType} onChange={(e) => setLeaveDraft((p) => ({ ...p, leaveType: e.target.value }))} className="px-3 py-2 rounded-lg border bg-transparent">{leaveTypes.map((type) => <option key={type}>{type}</option>)}</select>
                <input type="date" value={leaveDraft.startDate} onChange={(e) => setLeaveDraft((p) => ({ ...p, startDate: e.target.value }))} className="px-3 py-2 rounded-lg border bg-transparent" />
                <input type="date" value={leaveDraft.endDate} onChange={(e) => setLeaveDraft((p) => ({ ...p, endDate: e.target.value }))} className="px-3 py-2 rounded-lg border bg-transparent" />
                <input value={leaveDraft.reason} onChange={(e) => setLeaveDraft((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason" className="px-3 py-2 rounded-lg border bg-transparent" />
                <button type="button" onClick={() => void applyLeave()} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Apply</button>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
              <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
              <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Date</th><th className="py-3 pr-3">In</th><th className="py-3 pr-3">Out</th><th className="py-3 pr-3">Status</th><th className="py-3">Work</th></tr></thead><tbody>{(employee.attendanceRecords || []).map((record) => <tr key={record.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{shortDate(record.attendanceDate)}</td><td className="py-3 pr-3">{shortDateTime(record.checkInAt)}</td><td className="py-3 pr-3">{shortDateTime(record.checkOutAt)}</td><td className="py-3 pr-3">{record.status}</td><td className="py-3">{record.totalWorkingMinutes}m</td></tr>)}</tbody></table>
            </div>

            <div className="lg:col-span-3 rounded-lg border border-neutral-200 bg-white p-5 dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
              <h2 className="text-xl font-semibold mb-4">Leave History</h2>
              <table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Type</th><th className="py-3 pr-3">Dates</th><th className="py-3 pr-3">Status</th><th className="py-3">Reason</th></tr></thead><tbody>{(employee.leaveRequests || []).map((leave) => <tr key={leave.id} className="border-b border-neutral-100 dark:border-neutral-800/50"><td className="py-3 pr-3">{leave.leaveType}</td><td className="py-3 pr-3">{shortDate(leave.startDate)} - {shortDate(leave.endDate)}</td><td className="py-3 pr-3">{leave.status}</td><td className="py-3">{leave.reason || "-"}</td></tr>)}</tbody></table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
