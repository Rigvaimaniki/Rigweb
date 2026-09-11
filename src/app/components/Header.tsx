import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleUser, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/app/contexts/AuthContext";
import { PrimaryButton } from "./Buttons";
import logo from "@/assets/rigvaimaniki-logo.png";

export function Header() {
  const { openAuthModal, user } = useAuth();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo(
    () => [
      { name: "Home", path: "/" },
      { name: "Param", path: "/param" },
      { name: "AI", path: "/ai" },
      { name: "Defence", path: "/defence" },
      { name: "Passion", path: "/passion" },
      { name: "Careers", path: "/careers" },
      { name: "Contact", path: "/contact" },
      ...(["admin", "super_admin"].includes(user?.role || "") || user?.emailVerifiedAt ? [{ name: "Employee", path: "/employee" }] : []),
      ...(["admin", "super_admin"].includes(user?.role || "") ? [{ name: "Admin", path: "/admin" }] : [])
    ],
    [user?.emailVerifiedAt, user?.role],
  );

  // 1) Shrink-on-scroll header
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const headerHeight = isScrolled ? "h-16" : "h-18";
  const navPaddingY = isScrolled ? "py-2.5" : "py-3";
  const blurClass = isScrolled ? "backdrop-blur-lg" : "backdrop-blur-md";

  // 2) Slight transparency (premium, subtle)
  const headerBg = "bg-white/100 border-b border-neutral-200/60";

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        headerBg,
        blurClass,
      ].join(" ")}
    >
      <nav
        className={[
          "max-w-7xl mx-auto px-10 flex items-center justify-between transition-all duration-300",
          headerHeight,
          navPaddingY,
        ].join(" ")}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 min-w-[180px] translate-y-[16px]">
          {/* Keep layout small but scale visually */}
          <img
            src={logo}
            className="h-11  w-auto scale-[4] origin-left select-none"
            draggable={false}
          />

          {/* Optional brand text (md+) */}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={[
                  "relative text-sm tracking-wide transition-colors",
                  active ? "text-blue-600" : "text-neutral-700 hover:text-neutral-900",
                ].join(" ")}
              >
                <span>{link.name}</span>

                {/* 3) Animated underline for active link */}
                <span className="absolute left-0 right-0 -bottom-2 flex justify-center">
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "70%", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="h-[2px] rounded-full bg-blue-600"
                      />
                    )}
                  </AnimatePresence>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <CircleUser size={18} />
              <span>{user ? user.email : "Login / Signup"}</span>
            </button>
          </div>

          {/* 4) Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100/70 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay + panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden relative z-50 border-t border-neutral-200/60 bg-white/90 backdrop-blur-xl"
            >
              <div className="max-w-7xl mx-auto px-6 py-5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {navLinks.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={[
                          "rounded-xl px-4 py-3 text-sm transition-colors border",
                          active
                            ? "text-blue-600 border-blue-600/30 bg-blue-600/5"
                            : "text-neutral-800 border-neutral-200/60 hover:bg-neutral-100/60",
                        ].join(" ")}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={openAuthModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <CircleUser size={18} />
                    <span>{user ? user.email : "Login / Signup"}</span>
                  </button>
                </div>

                <div className="text-xs text-neutral-500 pt-1">
                  Rigvaimaniki Technologies
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
