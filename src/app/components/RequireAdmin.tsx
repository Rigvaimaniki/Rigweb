import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";
import type { ReactNode } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-600">
        Checking access...
      </div>
    );
  }

  if (!user || !["admin", "super_admin"].includes(user.role)) {
    // Keep non-admin users out of the dashboard entirely.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
