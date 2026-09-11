import { useEffect, useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/app/components/Buttons";
import { API_BASE, api } from "@/app/lib/api";
import { DRONE_IMAGES } from "@/app/constants/droneImages";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  mobileCountry?: string;
  mobilePhone?: string | null;
  role: "user" | "admin" | "super_admin";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
};

type LoginEvent = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
};

type CourseCategory = "basic" | "moderate" | "advance";

type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  category: CourseCategory;
  features: string[];
  images?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Enrollment = {
  id: string;
  userEmail: string | null;
  billingName: string | null;
  billingPhone: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  city: string | null;
  state: string | null;
  preferredBatch: string | null;
  experienceLevel: string | null;
  profession: string | null;
  college: string | null;
  agreedToFollowUp: boolean;
  courseName: string;
  orderId: string;
  paymentId: string | null;
  amountPaise: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  paymentReceived: boolean;
};

type PaymentAttempt = {
  id: string;
  orderId: string | null;
  paymentId: string | null;
  userEmail: string | null;
  billingName: string | null;
  billingPhone: string | null;
  courseName: string | null;
  amountPaise: number | null;
  currency: string | null;
  status: string;
  failureStage: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
};

type CourseForm = {
  title: string;
  description: string;
  price: string;
  duration: string;
  category: CourseCategory;
  featuresText: string;
  imagesText: string;
  isActive: boolean;
  sortOrder: string;
};

const initialCourseForm: CourseForm = {
  title: "",
  description: "",
  price: "",
  duration: "",
  category: "basic",
  featuresText: "",
  imagesText: "",
  isActive: true,
  sortOrder: "0"
};

function parseFeatures(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDrafts, setCourseDrafts] = useState<Record<string, CourseForm>>({});
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [paymentAttempts, setPaymentAttempts] = useState<PaymentAttempt[]>([]);
  const [attemptFilters, setAttemptFilters] = useState({
    status: "",
    failureStage: "",
    failureReason: "",
    orderId: "",
    page: 1
  });
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentDraft, setEnrollmentDraft] = useState<Partial<Enrollment> | null>(null);
  const [enrollmentFilters, setEnrollmentFilters] = useState({ course: "", page: 1 });
  const [newCourse, setNewCourse] = useState<CourseForm>(initialCourseForm);
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userCount = useMemo(() => users.length, [users.length]);
  const adminCount = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "super_admin").length,
    [users]
  );

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, coursesRes, eventsRes, enrollmentsRes] = await Promise.all([
        api<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(userQuery)}`),
        api<{ courses: Course[] }>("/admin/courses"),
        api<{ events: LoginEvent[] }>("/admin/logins"),
        api<{ enrollments: Enrollment[]; pagination: any }>("/admin/enrollments")
      ]);

      setUsers(usersRes.users);
      setCourses(coursesRes.courses);
      setEvents(eventsRes.events);
      setEnrollments(enrollmentsRes.enrollments);

      const draftMap: Record<string, CourseForm> = {};
      for (const course of coursesRes.courses) {
        draftMap[course.id] = {
          title: course.title,
          description: course.description,
          price: String(course.price),
          duration: course.duration,
          category: course.category,
          featuresText: (course.features || []).join("\n"),
          imagesText: (course.images || []).join("\n"),
          isActive: Boolean(course.isActive),
          sortOrder: String(course.sortOrder ?? 0)
        };
      }
      setCourseDrafts(draftMap);
    } catch (err: any) {
      setError(err?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserRole(user: AdminUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; user: AdminUser }>(
        `/admin/users/${user.id}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: nextRole })
        }
      );

      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUserVerification(user: Pick<AdminUser, "id" | "emailVerifiedAt">) {
    const verified = !user.emailVerifiedAt;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; user: AdminUser }>(
        `/admin/users/${user.id}/verification`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified })
        }
      );

      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      setEvents((prev) =>
        prev.map((event) =>
          event.user.id === user.id
            ? { ...event, user: { ...event.user, emailVerifiedAt: res.user.emailVerifiedAt } }
            : event
        )
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update employee verification");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean }>(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete user");
    } finally {
      setBusy(false);
    }
  }

  async function searchUsers() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(userQuery)}`);
      setUsers(res.users);
    } catch (err: any) {
      setError(err?.message || "Failed to search users");
    } finally {
      setBusy(false);
    }
  }

  async function createCourse() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; course: Course }>("/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCourse,
          price: Number(newCourse.price),
          features: parseFeatures(newCourse.featuresText),
          images: parseFeatures(newCourse.imagesText),
          isActive: newCourse.isActive,
          sortOrder: Number(newCourse.sortOrder || 0)
        })
      });

      setCourses((prev) => [res.course, ...prev]);
      setCourseDrafts((prev) => ({
        [res.course.id]: {
          title: res.course.title,
          description: res.course.description,
          price: String(res.course.price),
          duration: res.course.duration,
          category: res.course.category,
          featuresText: (res.course.features || []).join("\n"),
          imagesText: (res.course.images || []).join("\n"),
          isActive: Boolean(res.course.isActive),
          sortOrder: String(res.course.sortOrder ?? 0)
        },
        ...prev
      }));
      setNewCourse(initialCourseForm);
    } catch (err: any) {
      setError(err?.message || "Failed to create course");
    } finally {
      setBusy(false);
    }
  }

  async function seedDefaultCourses() {
    setBusy(true);
    setError(null);
    try {
      await api("/admin/courses/seed-defaults", { method: "POST" });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to seed default courses");
    } finally {
      setBusy(false);
    }
  }

  function updateCourseDraft(
    courseId: string,
    field: keyof CourseForm,
    value: CourseForm[keyof CourseForm]
  ) {
    setCourseDrafts((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value
      }
    }));
  }

  async function saveCourse(courseId: string) {
    const draft = courseDrafts[courseId];
    if (!draft) return;

    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; course: Course }>(`/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          price: Number(draft.price),
          duration: draft.duration,
          category: draft.category,
          features: parseFeatures(draft.featuresText),
          images: parseFeatures(draft.imagesText),
          isActive: draft.isActive,
          sortOrder: Number(draft.sortOrder || 0)
        })
      });

      setCourses((prev) => prev.map((course) => (course.id === courseId ? res.course : course)));
    } catch (err: any) {
      setError(err?.message || "Failed to update course");
    } finally {
      setBusy(false);
    }
  }

  async function duplicateCourse(courseId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; course: Course }>(`/admin/courses/${courseId}/duplicate`, {
        method: "POST"
      });
      setCourses((prev) => [res.course, ...prev]);
      setCourseDrafts((prev) => ({
        [res.course.id]: {
          title: res.course.title,
          description: res.course.description,
          price: String(res.course.price),
          duration: res.course.duration,
          category: res.course.category,
          featuresText: (res.course.features || []).join("\n"),
          isActive: Boolean(res.course.isActive),
          sortOrder: String(res.course.sortOrder ?? 0)
        },
        ...prev
      }));
    } catch (err: any) {
      setError(err?.message || "Failed to duplicate course");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImageForCourse(courseId: string) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const key = window.prompt("Enter image key (e.g. FD1). This will be used as the stored filename:", "");
      if (key === null) return; // cancelled

      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("key", key.trim());

        const uploadRes = await fetch(`${API_BASE}/admin/uploads`, {
          method: "POST",
          credentials: "include",
          body: form
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.ok) throw new Error(uploadData?.error || "Upload failed");

        // attach key to course images
        const course = courses.find((c) => c.id === courseId);
        const nextImages = Array.from(new Set([...(course?.images || []), String(uploadData.key)]));

        await api(`/admin/courses/${courseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: nextImages })
        });

        await loadAll();
      } catch (err: any) {
        setError(err?.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    };
    fileInput.click();
  }

  async function uploadImageForNewCourse() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const key = window.prompt("Enter image key (e.g. FD1). This will be used as the stored filename:", "");
      if (key === null) return; // cancelled

      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("key", key.trim());

        const uploadRes = await fetch(`${API_BASE}/admin/uploads`, {
          method: "POST",
          credentials: "include",
          body: form
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.ok) throw new Error(uploadData?.error || "Upload failed");

        setNewCourse((prev) => {
          const existing = parseFeatures(prev.imagesText);
          const next = Array.from(new Set([...existing, String(uploadData.key)]));
          return { ...prev, imagesText: next.join("\n") };
        });
      } catch (err: any) {
        setError(err?.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    };
    fileInput.click();
  }

  async function removeCourse(courseId: string) {
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean }>(`/admin/courses/${courseId}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setCourseDrafts((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete course");
    } finally {
      setBusy(false);
    }
  }

  async function loadEnrollments() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ enrollments: Enrollment[]; pagination: any }>(
        `/admin/enrollments?course=${enrollmentFilters.course}&page=${enrollmentFilters.page}`
      );
      setEnrollments(res.enrollments);
    } catch (err: any) {
      setError(err?.message || "Failed to load enrollments");
    } finally {
      setBusy(false);
    }
  }

  function openEnrollment(enrollment: Enrollment) {
    setActiveEnrollment(enrollment);
    setEnrollmentDraft({ ...enrollment });
  }

  async function saveEnrollment() {
    if (!activeEnrollment || !enrollmentDraft) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ ok: boolean; enrollment: Enrollment }>(
        `/admin/enrollments/${activeEnrollment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingName: enrollmentDraft.billingName,
            billingPhone: enrollmentDraft.billingPhone,
            firstName: enrollmentDraft.firstName,
            lastName: enrollmentDraft.lastName,
            gender: enrollmentDraft.gender,
            email: enrollmentDraft.email,
            dateOfBirth: enrollmentDraft.dateOfBirth,
            city: enrollmentDraft.city,
            state: enrollmentDraft.state,
            preferredBatch: enrollmentDraft.preferredBatch,
            experienceLevel: enrollmentDraft.experienceLevel,
            profession: enrollmentDraft.profession,
            college: enrollmentDraft.college,
            agreedToFollowUp: enrollmentDraft.agreedToFollowUp,
            status: enrollmentDraft.status,
            paymentReceived: enrollmentDraft.paymentReceived
          })
        }
      );
      setEnrollments((prev) => prev.map((e) => (e.id === res.enrollment.id ? res.enrollment : e)));
      setActiveEnrollment(res.enrollment);
      setEnrollmentDraft({ ...res.enrollment });
    } catch (err: any) {
      setError(err?.message || "Failed to update enrollment");
    } finally {
      setBusy(false);
    }
  }

  async function resendInvoice() {
    if (!activeEnrollment) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/enrollments/${activeEnrollment.id}/resend-invoice`, { method: "POST" });
    } catch (err: any) {
      setError(err?.message || "Failed to resend invoice");
    } finally {
      setBusy(false);
    }
  }

  async function togglePaymentReceived(enrollmentId: string, currentValue: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean; enrollment: Enrollment }>(
        `/admin/enrollments/${enrollmentId}/payment-received`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentReceived: !currentValue })
        }
      );
      setEnrollments((prev) => prev.map((enrollment) =>
        enrollment.id === enrollmentId
          ? { ...enrollment, paymentReceived: !currentValue }
          : enrollment
      ));
    } catch (err: any) {
      setError(err?.message || "Failed to update payment status");
    } finally {
      setBusy(false);
    }
  }

  async function exportEnrollments() {
    try {
      const exportUrl = new URL(`${API_BASE}/admin/enrollments/export`);
      if (enrollmentFilters.course) exportUrl.searchParams.set("course", enrollmentFilters.course);

      const response = await fetch(exportUrl.toString(), {
        credentials: "include",
        headers: { Accept: "text/csv" }
      });

      if (!response.ok) {
        const maybeText = await response.text().catch(() => "");
        throw new Error(maybeText || `Export failed (${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const maybeText = await response.text().catch(() => "");
        throw new Error(maybeText || "Export failed (received HTML instead of CSV)");
      }

      // Use a UTF-8 BOM so Excel opens CSV with correct encoding by default.
      const csvText = await response.text();
      const blob = new Blob([`\ufeff${csvText}`], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'enrollments.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Failed to export enrollments");
    }
  }

  async function loadPaymentAttempts() {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (attemptFilters.status) params.set("status", attemptFilters.status);
      if (attemptFilters.failureStage) params.set("failureStage", attemptFilters.failureStage);
      if (attemptFilters.failureReason) params.set("failureReason", attemptFilters.failureReason);
      if (attemptFilters.orderId) params.set("orderId", attemptFilters.orderId);
      params.set("page", String(attemptFilters.page));

      const res = await api<{ attempts: PaymentAttempt[]; pagination: any }>(
        `/admin/payment-attempts?${params.toString()}`
      );
      setPaymentAttempts(res.attempts);
    } catch (err: any) {
      setError(err?.message || "Failed to load payment attempts");
    } finally {
      setBusy(false);
    }
  }

  async function exportPaymentAttempts() {
    try {
      const exportUrl = new URL(`${API_BASE}/admin/payment-attempts/export`);
      if (attemptFilters.status) exportUrl.searchParams.set("status", attemptFilters.status);
      if (attemptFilters.failureStage) exportUrl.searchParams.set("failureStage", attemptFilters.failureStage);
      if (attemptFilters.failureReason) exportUrl.searchParams.set("failureReason", attemptFilters.failureReason);
      if (attemptFilters.orderId) exportUrl.searchParams.set("orderId", attemptFilters.orderId);

      const response = await fetch(exportUrl.toString(), {
        credentials: "include",
        headers: { Accept: "text/csv" }
      });

      if (!response.ok) {
        const maybeText = await response.text().catch(() => "");
        throw new Error(maybeText || `Export failed (${response.status})`);
      }

      const csvText = await response.text();
      const blob = new Blob([`\ufeff${csvText}`], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payment_attempts.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Failed to export payment attempts");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 text-center text-neutral-600">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl mb-2">Admin Dashboard</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Users: {userCount} | Admins: {adminCount} | Courses: {courses.length}
            </p>
          </div>
          <SecondaryButton onClick={() => void loadAll()} disabled={busy}>
            Refresh Data
          </SecondaryButton>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-2xl mb-4">Users Management</h2>
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search users (email, name, mobile)"
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
            />
            <button
              type="button"
              onClick={() => void searchUsers()}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 text-sm"
            >
              Search
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Mobile</th>
                  <th className="py-3 pr-3">Role</th>
                  <th className="py-3 pr-3">Employee Access</th>
                  <th className="py-3 pr-3">Last Login</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="py-3 pr-3">{user.email}</td>
                    <td className="py-3 pr-3">{user.mobilePhone || "-"}</td>
                    <td className="py-3 pr-3 capitalize">{user.role}</td>
                    <td className="py-3 pr-3">
                      {user.emailVerifiedAt ? (
                        <span className="text-green-700 dark:text-green-300">Verified</span>
                      ) : (
                        <span className="text-neutral-500">Not verified</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleUserRole(user)}
                        disabled={busy}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                      >
                        {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleUserVerification(user)}
                        disabled={busy}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
                      >
                        {user.emailVerifiedAt ? "Unverify Email" : "Verify Email"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(user.id)}
                        disabled={busy}
                        className="px-3 py-2 rounded-lg border border-red-300 text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
                      >
                        Delete User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 space-y-5">
          <h2 className="text-2xl">Courses Management</h2>
          {courses.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-900/40">
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                No courses found in DB. Restore the default courses to get started.
              </div>
              <button
                type="button"
                onClick={() => void seedDefaultCourses()}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
              >
                Restore Default Courses
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input
              value={newCourse.title}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Course title"
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
            <input
              value={newCourse.description}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
            <input
              value={newCourse.price}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Original Price (INR)"
              type="number"
              min={0}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />

            <input
              value={newCourse.duration}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, duration: e.target.value }))}
              placeholder="Duration (e.g. 24 hours)"
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
            <select
              value={newCourse.category}
              onChange={(e) =>
                setNewCourse((prev) => ({ ...prev, category: e.target.value as CourseCategory }))
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            >
              <option value="basic">basic</option>
              <option value="moderate">moderate</option>
              <option value="advance">advance</option>
            </select>
            <input
              value={newCourse.sortOrder}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, sortOrder: e.target.value }))}
              placeholder="Sort"
              type="number"
              min={0}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
            <textarea
              value={newCourse.featuresText}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, featuresText: e.target.value }))}
              placeholder={"Features (one per line)\nExample:\nDrone fundamentals\nFlight basics"}
              rows={4}
              className="md:col-span-5 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
            <textarea
              value={newCourse.imagesText}
              onChange={(e) => setNewCourse((prev) => ({ ...prev, imagesText: e.target.value }))}
              placeholder={"Image keys (one per line)\nExample:\nB1\nB2\nB3"}
              rows={4}
              className="md:col-span-5 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
            />
            <label className="inline-flex items-center gap-2 text-sm md:justify-self-end select-none">
              <input
                type="checkbox"
                checked={newCourse.isActive}
                onChange={(e) => setNewCourse((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <PrimaryButton onClick={() => void createCourse()} disabled={busy}>
            Add Course
          </PrimaryButton>
          <SecondaryButton onClick={() => void uploadImageForNewCourse()} disabled={busy}>
            Upload Image
          </SecondaryButton>

          <div className="space-y-4">
            {courses.map((course) => {
              const draft = courseDrafts[course.id];
              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    <input
                      value={draft?.title || ""}
                      onChange={(e) => updateCourseDraft(course.id, "title", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />
                    <input
                      value={draft?.description || ""}
                      onChange={(e) => updateCourseDraft(course.id, "description", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />
                    <input
                      type="number"
                      min={0}
                      value={draft?.price || ""}
                      onChange={(e) => updateCourseDraft(course.id, "price", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />

                    <input
                      value={draft?.duration || ""}
                      onChange={(e) => updateCourseDraft(course.id, "duration", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />
                    <select
                      value={draft?.category || "basic"}
                      onChange={(e) =>
                        updateCourseDraft(course.id, "category", e.target.value as CourseCategory)
                      }
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    >
                      <option value="basic">basic</option>
                      <option value="moderate">moderate</option>
                      <option value="advance">advance</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={draft?.sortOrder || ""}
                      onChange={(e) => updateCourseDraft(course.id, "sortOrder", e.target.value)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                    <textarea
                      value={draft?.featuresText || ""}
                      onChange={(e) => updateCourseDraft(course.id, "featuresText", e.target.value)}
                      rows={3}
                      className="md:col-span-5 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    />
                      <textarea
                        value={draft?.imagesText || ""}
                        onChange={(e) => updateCourseDraft(course.id, "imagesText", e.target.value)}
                        rows={2}
                        placeholder={"Image keys (one per line)"}
                        className="md:col-span-5 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent"
                      />
                    <label className="inline-flex items-center gap-2 text-sm md:justify-self-end select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(draft?.isActive)}
                        onChange={(e) => updateCourseDraft(course.id, "isActive", e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void saveCourse(course.id)}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                    >
                      Save Course
                    </button>
                    <button
                      type="button"
                      onClick={() => void uploadImageForCourse(course.id)}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg border border-neutral-300 disabled:opacity-50"
                    >
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewCourseId((prev) => (prev === course.id ? null : course.id))}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-50"
                    >
                      {previewCourseId === course.id ? "Hide Preview" : "Preview"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicateCourse(course.id)}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCourse(course.id)}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg border border-red-300 text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300"
                    >
                      Delete Course
                    </button>
                  </div>
                  {previewCourseId === course.id && draft && (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950/40">
                      <div className="text-sm font-semibold">{draft.title}</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {draft.category} • {draft.duration}
                      </div>
                      <div className="text-sm mt-2">
                        INR {Math.max(0, Number(draft.price || 0))}
                      </div>
                      {(draft.imagesText || "").trim() && (
                        <div className="mt-3 flex gap-2">
                          {parseFeatures(draft.imagesText).map((k) => {
                            const key = k.trim();
                            const mapped = (DRONE_IMAGES as any)[String(key).toUpperCase()];
                            const src = mapped || (key.startsWith("/") || key.startsWith("http") ? key : `/media/${key}.png`);
                            return (
                              <img key={k} src={src} alt={key} className="h-16 w-28 object-contain rounded-md border bg-black/10" />
                            );
                          })}
                        </div>
                      )}

                      {draft.featuresText.trim() && (
                        <ul className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 list-disc pl-4 space-y-1">
                          {parseFeatures(draft.featuresText).slice(0, 6).map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl">Enrolled Students</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={enrollmentFilters.course}
                onChange={(e) => setEnrollmentFilters(prev => ({ ...prev, course: e.target.value }))}
                placeholder="Filter by course"
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => void loadEnrollments()}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 text-sm"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={() => void exportEnrollments()}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 text-sm"
              >
                Export to Excel
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Mobile</th>
                  <th className="py-3 pr-3">Course</th>
                  <th className="py-3 pr-3">Batch</th>
                  <th className="py-3 pr-3">Experience</th>
                  <th className="py-3 pr-3">Payment Received</th>
                  <th className="py-3 pr-3">Enrolled At</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="py-3 pr-3">{enrollment.firstName && enrollment.lastName ? `${enrollment.firstName} ${enrollment.lastName}` : enrollment.billingName || enrollment.userEmail}</td>
                    <td className="py-3 pr-3">{enrollment.email || enrollment.userEmail}</td>
                    <td className="py-3 pr-3">{enrollment.billingPhone}</td>
                    <td className="py-3 pr-3">{enrollment.courseName}</td>
                    <td className="py-3 pr-3 capitalize">{enrollment.preferredBatch}</td>
                    <td className="py-3 pr-3">{enrollment.experienceLevel === 'prior_knowledge' ? 'Prior Knowledge' : 'Beginner'}</td>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={enrollment.paymentReceived}
                        onChange={() => void togglePaymentReceived(enrollment.id, enrollment.paymentReceived)}
                        disabled={busy}
                        className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 pr-3">{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => {
                          // Could add view details modal here
                          alert(`Order ID: ${enrollment.orderId}\nStatus: ${enrollment.status}\nAmount: ₹${(enrollment.amountPaise / 100).toFixed(2)}`);
                        }}
                        className="px-2 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700"
                      >
                        View / Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openEnrollment(enrollment)}
                        className="ml-2 px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl">Payment Attempts</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={attemptFilters.orderId}
                onChange={(e) => setAttemptFilters((p) => ({ ...p, orderId: e.target.value }))}
                placeholder="Search orderId"
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <input
                value={attemptFilters.failureStage}
                onChange={(e) => setAttemptFilters((p) => ({ ...p, failureStage: e.target.value }))}
                placeholder="failureStage"
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <input
                value={attemptFilters.failureReason}
                onChange={(e) => setAttemptFilters((p) => ({ ...p, failureReason: e.target.value }))}
                placeholder="failureReason"
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
              <select
                value={attemptFilters.status}
                onChange={(e) => setAttemptFilters((p) => ({ ...p, status: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              >
                <option value="">All</option>
                <option value="created">created</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="cancelled">cancelled</option>
              </select>
              <button
                type="button"
                onClick={() => void loadPaymentAttempts()}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 text-sm"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={() => void exportPaymentAttempts()}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50 text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-3 pr-3">Order</th>
                  <th className="py-3 pr-3">User</th>
                  <th className="py-3 pr-3">Course</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Failure</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {paymentAttempts.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="py-3 pr-3 font-mono text-xs">{a.orderId || "-"}</td>
                    <td className="py-3 pr-3">{a.userEmail || "-"}</td>
                    <td className="py-3 pr-3">{a.courseName || "-"}</td>
                    <td className="py-3 pr-3">{a.status}</td>
                    <td className="py-3 pr-3 text-xs">
                      {a.failureStage ? `${a.failureStage}${a.failureReason ? `: ${a.failureReason}` : ""}` : "-"}
                    </td>
                    <td className="py-3">{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {activeEnrollment && enrollmentDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setActiveEnrollment(null);
                setEnrollmentDraft(null);
              }}
            />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Enrollment Detail</h3>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Order: {activeEnrollment.orderId} • Course: {activeEnrollment.courseName}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                  onClick={() => {
                    setActiveEnrollment(null);
                    setEnrollmentDraft(null);
                  }}
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">First name</label>
                  <input
                    value={enrollmentDraft.firstName || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), firstName: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Last name</label>
                  <input
                    value={enrollmentDraft.lastName || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), lastName: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Email</label>
                  <input
                    value={enrollmentDraft.email || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), email: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Mobile</label>
                  <input
                    value={enrollmentDraft.billingPhone || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), billingPhone: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">City</label>
                  <input
                    value={enrollmentDraft.city || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), city: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">State</label>
                  <input
                    value={enrollmentDraft.state || ""}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), state: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Status</label>
                  <select
                    value={String(enrollmentDraft.status || "created")}
                    onChange={(e) => setEnrollmentDraft((p) => ({ ...(p || {}), status: e.target.value } as any))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
                  >
                    <option value="created">created</option>
                    <option value="paid">paid</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="inline-flex items-center gap-2 text-sm select-none">
                    <input
                      type="checkbox"
                      checked={Boolean((enrollmentDraft as any).paymentReceived)}
                      onChange={(e) =>
                        setEnrollmentDraft((p) => ({ ...(p || {}), paymentReceived: e.target.checked } as any))
                      }
                    />
                    Payment received
                  </label>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveEnrollment()}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => void resendInvoice()}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
                >
                  Resend Invoice Email
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-2xl mb-4">Login Activity</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-3 pr-3">User</th>
                  <th className="py-3 pr-3">Employee Access</th>
                  <th className="py-3 pr-3">IP</th>
                  <th className="py-3 pr-3">User Agent</th>
                  <th className="py-3 pr-3">Timestamp</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                    <td className="py-3 pr-3">{event.user.email}</td>
                    <td className="py-3 pr-3">
                      {event.user.emailVerifiedAt ? (
                        <span className="text-green-700 dark:text-green-300">Verified</span>
                      ) : (
                        <span className="text-neutral-500">Not verified</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">{event.ip || "-"}</td>
                    <td className="py-3 pr-3 max-w-[360px] truncate">{event.userAgent || "-"}</td>
                    <td className="py-3 pr-3">{new Date(event.createdAt).toLocaleString()}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => void toggleUserVerification(event.user)}
                        disabled={busy}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50"
                      >
                        {event.user.emailVerifiedAt ? "Unverify" : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
