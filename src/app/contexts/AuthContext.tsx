import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, API_BASE } from "@/app/lib/api";

type User = {
  id: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  name?: string | null;
  emailVerifiedAt?: string | null;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  showAuthModal: boolean;

  startGoogleAuth: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;

  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const refreshUser = async () => {
    setIsAuthLoading(true);
    return api<{ user: User | null }>("/auth/me", { method: "GET" })
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsAuthLoading(false));
  };

  // Keep session after refresh
  useEffect(() => {
    void refreshUser();
  }, []);

  const startGoogleAuth = () => {
    try {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      sessionStorage.setItem("auth:return_to", returnTo);
    } catch {
      // ignore storage issues (private mode, etc.)
    }
    window.location.href = `${API_BASE}/auth/google`;
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setIsAuthLoading(false);
    }
  };

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        showAuthModal,
        startGoogleAuth,
        refreshUser,
        logout,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
