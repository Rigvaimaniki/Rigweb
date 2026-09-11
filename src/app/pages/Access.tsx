import { useEffect } from "react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

export function Access() {
  const { isAuthenticated, isAuthLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      // Open login modal and send user to home (or stay) while modal shows
      openAuthModal();
      // Optional: move them away from access page until authenticated
      navigate("/", { replace: true, state: { next: location.pathname } });
    }
  }, [isAuthenticated, isAuthLoading, openAuthModal, navigate, location.pathname]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;

    let returnTo: string | null = null;
    try {
      returnTo = sessionStorage.getItem("auth:return_to");
      sessionStorage.removeItem("auth:return_to");
    } catch {
      // ignore storage issues
    }

    const isSafeInternalPath =
      !!returnTo &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//") &&
      !returnTo.startsWith("/access") &&
      !returnTo.startsWith("/register");

    const target = isSafeInternalPath ? returnTo! : "/";

    const t = window.setTimeout(() => {
      navigate(target, { replace: true });
    }, 900);

    return () => window.clearTimeout(t);
  }, [isAuthLoading, isAuthenticated, navigate]);

  // While redirecting / waiting, show nothing (keeps UX clean)
  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl p-12 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-6"
          >
            <CheckCircle className="text-green-600" size={80} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl mb-4"
          >
            You are logged in
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 mb-12"
          >
            Redirecting you back to the website...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
