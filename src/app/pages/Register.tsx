import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/app/lib/api";
import { PrimaryButton } from "@/app/components/Buttons";
import { useAuth } from "@/app/contexts/AuthContext";

type PendingRegistration = {
  pending: boolean;
  email?: string;
  name?: string | null;
};

export function Register() {
  const navigate = useNavigate();
  const { user, isAuthLoading, refreshUser, startGoogleAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingRegistration | null>(null);
  const [name, setName] = useState("");
  const [mobileCountry, setMobileCountry] = useState<"IN" | "INTL">("IN");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate("/access", { replace: true });
      return;
    }

    api<PendingRegistration>("/auth/google/pending")
      .then((res) => {
        setPending(res);
        setName(res.name?.trim() || "");
      })
      .catch(() => setPending({ pending: false }))
      .finally(() => setLoading(false));
  }, [isAuthLoading, navigate, user]);

  const completeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const rawMobile = mobile.trim();
      if (!rawMobile) {
        throw new Error("Mobile number is required");
      }

      let normalizedMobile = rawMobile;
      if (mobileCountry === "IN") {
        const digits = rawMobile.replace(/\D/g, "");
        let local = digits;
        if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
        if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
        if (!/^\d{10}$/.test(local)) {
          throw new Error("India mobile must be 10 digits");
        }
        normalizedMobile = local;
      } else {
        normalizedMobile = rawMobile.replace(/\s+/g, "");
        if (!/^\+[1-9]\d{6,14}$/.test(normalizedMobile)) {
          throw new Error("Mobile must be in E.164 format (e.g. +14155552671)");
        }
      }

      await api("/auth/google/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          mobileCountry,
          mobile: normalizedMobile
        })
      });

      await refreshUser();
      navigate("/access", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Try Google sign-in again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6 text-neutral-600">
        Preparing registration...
      </div>
    );
  }

  if (!pending?.pending) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 bg-white dark:bg-neutral-900">
          <h1 className="text-2xl mb-2">Continue with Google</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Registration session expired. Start again with Google authentication.
          </p>
          <PrimaryButton className="w-full" onClick={startGoogleAuth}>
            Continue with Google
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 bg-white dark:bg-neutral-900">
        <h1 className="text-2xl mb-2">Complete Registration</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          We verified your Google account. Finish setup to create your account.
        </p>

        <div className="text-sm mb-5 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <span className="text-neutral-500">Google Email:</span>{" "}
          <span className="font-medium">{pending.email}</span>
        </div>

        {error && (
          <div className="mb-4 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={completeRegistration} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Mobile number</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={mobileCountry}
                onChange={(e) => setMobileCountry(e.target.value as "IN" | "INTL")}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="IN">India (+91)</option>
                <option value="INTL">International</option>
              </select>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={mobileCountry === "IN" ? "10-digit mobile" : "+14155552671"}
                className="sm:col-span-2 w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                inputMode="tel"
              />
            </div>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              {mobileCountry === "IN"
                ? "India numbers must be exactly 10 digits."
                : "Use E.164 format for international numbers (example: +14155552671)."}
            </p>
          </div>

          <PrimaryButton className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
