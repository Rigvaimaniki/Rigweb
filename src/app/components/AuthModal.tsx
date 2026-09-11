import { X } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export function AuthModal() {
  const { showAuthModal, closeAuthModal, startGoogleAuth } = useAuth();

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              <button
                onClick={closeAuthModal}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl mb-2">Login / Signup</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Continue securely with your Google account.
              </p>

              <button
                type="button"
                onClick={startGoogleAuth}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Continue with Google
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
