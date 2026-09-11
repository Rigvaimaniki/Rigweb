import { type ReactNode, useEffect, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone } from "lucide-react";
import { PARAM_CENTERS, type ParamCardId } from "@/app/constants/paramData";
import { useAuth } from "@/app/contexts/AuthContext";
import { api } from "@/app/lib/api";
import { CoursesSection } from "@/app/pages/param/CoursesSection";
import { DEFAULT_PARAM_COURSES } from "@/app/pages/param/defaultCourses";
import { EnrollmentModals } from "@/app/pages/param/EnrollmentModals";
import { PurposeSection } from "@/app/pages/param/PurposeSection";
import type { ApiCourse, Course } from "@/app/pages/param/types";
import { getPayableInr, inr } from "@/app/pages/param/utils";
import "@/styles/param.css";

type ActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  type?: "button";
  disabled?: boolean;
  className?: string;
};

const LOCATION_ADDRESS = "A8 Residency Road, Opposite Nagar Nigam";

function mapCourseCategory(value: ApiCourse["category"]): Course["category"] {
  if (value === "basic") return "Basic";
  if (value === "moderate") return "Moderate";
  return "Advance";
}

function toCourse(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    category: mapCourseCategory(apiCourse.category),
    title: apiCourse.title,
    description: apiCourse.description || "",
    duration: apiCourse.duration,
    features: apiCourse.features || [],
    pricing: { originalInr: Number(apiCourse.price) || 0, discountPercent: Number(apiCourse.discountPercent) || 0 },
    images: apiCourse.images || [],
  };
}

function ActionButton({
  children,
  onClick,
  href,
  external = false,
  variant = "primary",
  fullWidth = false,
  type = "button",
  disabled = false,
  className = "",
}: ActionButtonProps) {
  const baseClasses =
    "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm md:text-base font-semibold transition-all duration-200 focus:outline-none";
  const interactionClasses = disabled ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.03]";
  const variantClasses =
    variant === "primary"
      ? "bg-[#D4AF37] text-black shadow-sm hover:bg-[#e5c96d] hover:shadow-md"
      : "border border-white/25 bg-white/10 text-white shadow-sm hover:bg-white/20 hover:shadow-md";
  const widthClass = fullWidth ? "w-full" : "";

  if (href) {
    if (disabled) {
      return (
        <span
          aria-disabled="true"
          className={`${baseClasses} ${interactionClasses} ${variantClasses} ${widthClass} ${className}`}
        >
          {children}
        </span>
      );
    }

    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${baseClasses} ${interactionClasses} ${variantClasses} ${widthClass} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${interactionClasses} ${variantClasses} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function Param() {
  const [openMore, setOpenMore] = useState<ParamCardId | null>(null);
  const { openAuthModal, isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showCourseSelect, setShowCourseSelect] = useState(false);
  const [billingCourse, setBillingCourse] = useState<Course | null>(null);
  const [billingInfo, setBillingInfo] = useState<{ name: string; mobile: string } | null>(null);
  const [enrollmentData, setEnrollmentData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    mobile: "",
    email: "",
    dateOfBirth: "",
    city: "",
    state: "",
    preferredBatch: "",
    experienceLevel: "",
    profession: "",
    college: "",
    agreedToFollowUp: false
  });
  const [billingError, setBillingError] = useState<string | null>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<string | null>(null);
  const [showPaymentButtons, setShowPaymentButtons] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const formatCenterLabel = (label: string) => {
    const dashIndex = label.indexOf("-");
    if (dashIndex === -1) return { brand: label, city: "" };

    const brand = label.slice(0, dashIndex).trim();
    const city = label.slice(dashIndex + 1).trim();
    return { brand, city };
  };

  const selectedCenter = PARAM_CENTERS[0];
  const mapsUrl = selectedCenter.mapsUrl;

  const toggleMore = (id: ParamCardId) =>
    setOpenMore((previous) => (previous === id ? null : id));

  const scrollToCourses = () => {
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const normalizeIndianMobile = (value: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";

    // Enforce India (+91) while being lenient with user input formats.
    // Examples accepted:
    // - 9876543210
    // - 09876543210
    // - 919876543210
    // - +91 9876543210
    let local = digits;
    if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
    if (local.length === 11 && local.startsWith("0")) local = local.slice(1);

    if (!/^\d{10}$/.test(local)) return "";
    return `+91${local}`;
  };

  const openBillingFor = (course: Course) => {
    setBillingError(null);
    setBillingCourse(course);
    setEnrollmentData({
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ").slice(1).join(" ") || "",
      gender: "",
      mobile: "",
      email: user?.email || "",
      dateOfBirth: "",
      city: "",
      state: "",
      preferredBatch: "",
      experienceLevel: "",
      profession: "",
      college: "",
      agreedToFollowUp: false
    });
  };

  const onEnroll = (course: Course) => {
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem("purchase:course_id", course.id);
      } catch {
        // ignore storage issues
      }
       openAuthModal();
       return;
     }

    openBillingFor(course);
  };

  useEffect(() => {
    setCoursesLoading(true);
    api<{ courses: ApiCourse[] }>("/courses")
      .then((res) => {
        const apiCourses = Array.isArray(res.courses) ? res.courses.map(toCourse) : [];
        setCourses(apiCourses.length > 0 ? apiCourses : DEFAULT_PARAM_COURSES);
      })
      .catch(() => setCourses(DEFAULT_PARAM_COURSES))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || selectedCourse || billingCourse) return;

    let pendingId: string | null = null;
    try {
      pendingId = sessionStorage.getItem("purchase:course_id");
      if (pendingId) sessionStorage.removeItem("purchase:course_id");
    } catch {
      // ignore storage issues
    }

    if (!pendingId) return;
    const pending = courses.find((course) => course.id === pendingId);
    if (pending) openBillingFor(pending);
  }, [isAuthenticated, selectedCourse, billingCourse, courses]);

  const beginPayment = async () => {
    if (!selectedCourse || paying) return;
    setPaying(true);
    setPayError(null);
    setPaySuccess(null);
    let createdOrderId: string | null = null;

    try {
      await loadRazorpayScript();

       const order = await api<{
         key_id: string;
         order_id: string;
         amount: number;
         currency: string;
         courseName: string;
         pricing: { originalInr: number; discountInr: number; payableInr: number; discountPercent: number };
       }>("/payments/create-order", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           courseId: selectedCourse.id,
           courseName: selectedCourse.title,
            billingName: billingInfo?.name || undefined,
            billingPhone: billingInfo?.mobile || undefined,
          }),
        });

        createdOrderId = order.order_id;

        const rzp = new window.Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
         order_id: order.order_id,
         name: "Rigvaimaniki Technologies",
         description: order.courseName,
          prefill: {
            name: billingInfo?.name || user?.name || undefined,
            contact: billingInfo?.mobile || undefined,
            email: user?.email || undefined,
          },
          handler: async (response: any) => {
            try {
              await api<{ ok: boolean; status: string; courseName: string }>("/payments/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });

              setSelectedCourse(null);
              setBillingInfo(null);
              setTimeout(() => setEnrollmentSuccess("Payment successful. Invoice email will be sent to your registered email."), 100);
            } catch (err: any) {
              setPayError(err?.message || "Payment verification failed.");
              try {
                await api("/payments/attempt-failure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: order.order_id,
                    status: "failed",
                    stage: "verify",
                    reason: err?.message || "Payment verification failed",
                    courseId: selectedCourse.id,
                    courseName: selectedCourse.title,
                    billingName: billingInfo?.name,
                    billingPhone: billingInfo?.mobile,
                    raw: response,
                  }),
                });
              } catch {
                // best-effort logging
              }
            }
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
              api("/payments/attempt-failure", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: order.order_id,
                    status: "cancelled",
                    stage: "checkout_dismissed",
                    reason: "User dismissed checkout",
                    courseId: selectedCourse.id,
                    courseName: selectedCourse.title,
                    billingName: billingInfo?.name,
                    billingPhone: billingInfo?.mobile,
                  }),
                }).catch(() => {});
            },
          },
          theme: { color: "#D4AF37" },
        });

        rzp.open();
    } catch (err: any) {
      setPayError(err?.message || "Payment failed. Please try again.");
      try {
        await api("/payments/attempt-failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrderId,
            status: "failed",
            stage: "init",
            reason: err?.message || "Payment initialization failed",
            courseId: selectedCourse.id,
            courseName: selectedCourse.title,
            billingName: billingInfo?.name,
            billingPhone: billingInfo?.mobile,
          }),
        });
      } catch {
        // best-effort logging
      }
    } finally {
      setPaying(false);
    }
  };

  const proceedFromBilling = async () => {
    if (!billingCourse) return;

    const data = enrollmentData;

    // Validation
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setBillingError("First name and last name are required");
      return;
    }
    if (!data.gender) {
      setBillingError("Gender is required");
      return;
    }
    if (!normalizeIndianMobile(data.mobile)) {
      setBillingError("Enter a valid Indian mobile number (+91)");
      return;
    }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setBillingError("Valid email is required");
      return;
    }
    if (!data.dateOfBirth) {
      setBillingError("Date of birth is required");
      return;
    }
    if (!data.city.trim() || !data.state.trim()) {
      setBillingError("City and state are required");
      return;
    }
    if (!data.preferredBatch) {
      setBillingError("Preferred batch is required");
      return;
    }
    if (!data.experienceLevel) {
      setBillingError("Experience level is required");
      return;
    }
    if (!data.agreedToFollowUp) {
      setBillingError("You must agree to share information and follow-up");
      return;
    }

    setBillingError(null);
    setPaying(true);

    const payload = {
      courseId: billingCourse.id,
      courseName: billingCourse.title,
      billingName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      billingPhone: normalizeIndianMobile(data.mobile),
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      city: data.city.trim(),
      state: data.state.trim(),
      preferredBatch: data.preferredBatch,
      experienceLevel: data.experienceLevel,
      profession: data.profession.trim() || undefined,
      college: data.college.trim() || undefined,
      agreedToFollowUp: data.agreedToFollowUp
    };

    try {
      if (import.meta.env.VITE_SHOW_PAYMENT_BUTTONS === 'true') {
        await loadRazorpayScript();

        const order = await api<{
          key_id: string;
          order_id: string;
          amount: number;
          currency: string;
          courseName: string;
          pricing: { originalInr: number; discountInr: number; payableInr: number; discountPercent: number };
        }>("/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const rzp = new window.Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,
          name: "Rigvaimaniki Technologies",
          description: order.courseName,
          prefill: {
            name: `${data.firstName.trim()} ${data.lastName.trim()}`,
            contact: normalizeIndianMobile(data.mobile),
            email: data.email.trim().toLowerCase(),
          },
          handler: async (response: any) => {
            try {
              await api<{ ok: boolean; status: string; courseName: string }>("/payments/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...response,
                  email: data.email.trim().toLowerCase(),
                  firstName: data.firstName.trim(),
                  lastName: data.lastName.trim(),
                  gender: data.gender,
                  dateOfBirth: data.dateOfBirth,
                  city: data.city.trim(),
                  state: data.state.trim(),
                  preferredBatch: data.preferredBatch,
                  experienceLevel: data.experienceLevel,
                  profession: data.profession.trim() || undefined,
                  college: data.college.trim() || undefined,
                  agreedToFollowUp: data.agreedToFollowUp
                }),
              });

              setShowPaymentButtons(import.meta.env.VITE_SHOW_PAYMENT_BUTTONS === 'true');
              setBillingCourse(null);
              setTimeout(() => setEnrollmentSuccess("Payment successful. Invoice email will be sent to your registered email."), 100);
            } catch (err: any) {
              setPayError(err?.message || "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
              api("/payments/attempt-failure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: order.order_id,
                  status: "cancelled",
                  stage: "checkout_dismissed",
                  reason: "User dismissed checkout",
                  courseId: billingCourse.id,
                  courseName: billingCourse.title,
                  billingName: `${data.firstName.trim()} ${data.lastName.trim()}`,
                  billingPhone: normalizeIndianMobile(data.mobile),
                }),
              }).catch(() => {});
            },
          },
          theme: { color: "#D4AF37" },
        });

        rzp.open();
      } else {
        await api<{ ok: boolean; enrollment: { id: string; courseName: string }; emailSent: boolean }>("/payments/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setShowPaymentButtons(false);
        setBillingCourse(null);
        setBillingInfo(null);
        setTimeout(() => setEnrollmentSuccess("You are successfully enrolled. Our team will reach you soon."), 100);
      }
    } catch (err: any) {
      setPayError(err?.message || "Enrollment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="param-page min-h-screen pt-24">
      <div className="param-content">
        <section className="px-6 pt-14 pb-10 md:pt-16 md:pb-14">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight"
            >
              <span className="whiteWithGoldOutline">PARAM</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-7 flex justify-center"
            >
              <div className="glass rounded-2xl px-5 py-4 w-full md:w-fit max-w-full">
                <div className="text-left">
                  <div className="text-sm md:text-base font-extrabold tracking-wide text-white/80 uppercase">
                    Active Centers
                  </div>
                  <div className="mt-2 leading-tight">
                    {(() => {
                      const { brand, city } = formatCenterLabel(selectedCenter.label);
                      return (
                        <div className="text-lg md:text-xl font-semibold tracking-[0.18em] text-white uppercase">
                          <span className="goldParticle">{brand} {city}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)] gap-3 items-stretch">
                  <ActionButton onClick={scrollToCourses} className="h-16 w-full md:w-[170px]">
                    View Courses
                  </ActionButton>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-16 w-full md:w-auto items-center justify-start gap-2.5 rounded-xl border border-white/25 bg-white/10 px-4 text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-white/20 hover:shadow-md"
                  >
                    <MapPin size={16} className="shrink-0 text-[#D4AF37]" />
                    <span className="min-w-0 leading-tight text-left">
                      <span className="block text-sm md:text-base font-semibold">Location</span>
                      <span className="block text-xs text-white/70 mt-0.5">{LOCATION_ADDRESS}</span>
                    </span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-10 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-3xl p-8 md:p-10 text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold headingText">What is PARAM?</h2>
              <p className="mt-4 text-lg md:text-xl leading-relaxed mutedText">
                PARAM is Rigvaimaniki Technologies&apos; UAV research and development initiative,
                designed to grow into a network of advanced design and testing labs across
                multiple locations.
                <br />
                The first center, Param-Jodhpur, focuses on UAV design, engineering, and
                training.
              </p>
            </div>
          </div>
        </section>

        <PurposeSection openMore={openMore} onToggleMore={toggleMore} onCloseMore={() => setOpenMore(null)} />

        <section className="px-6 py-10 md:py-12">
          <div className="max-w-7xl mx-auto">
            <CoursesSection courses={courses} coursesLoading={coursesLoading} onEnroll={onEnroll} />

            <div className="mt-10">
              <div className="glass rounded-2xl p-7 md:p-9 text-center shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
                <h2 className="text-3xl md:text-4xl font-semibold headingText">Start Your Drone Journey Today</h2>
                <p className="mt-3 text-sm md:text-base text-white/72">
                  Enroll in a practical program designed for real drone engineering workflows.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <ActionButton onClick={() => setShowCourseSelect(true)}>Enroll Now</ActionButton>
                  <ActionButton href={mapsUrl} external variant="secondary">
                    Location
                  </ActionButton>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/78">
                  <a href="tel:+916367803161" className="inline-flex items-center gap-2 hover:text-white">
                    <Phone size={16} className="text-[#D4AF37]" />
                    +91 6367803161
                  </a>
                  <span className="text-white/40">|</span>
                  <a href="https://wa.me/916367803161" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>


            <EnrollmentModals
              courses={courses}
              showCourseSelect={showCourseSelect}
              setShowCourseSelect={setShowCourseSelect}
              billingCourse={billingCourse}
              setBillingCourse={setBillingCourse}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              billingInfo={billingInfo}
              setBillingInfo={setBillingInfo}
              billingError={billingError}
              setBillingError={setBillingError}
              enrollmentData={enrollmentData}
              setEnrollmentData={setEnrollmentData}
              paying={paying}
              payError={payError}
              beginPayment={beginPayment}
              proceedFromBilling={proceedFromBilling}
              onEnroll={onEnroll}
              enrollmentSuccess={enrollmentSuccess}
              setEnrollmentSuccess={setEnrollmentSuccess}
              showPaymentButtons={showPaymentButtons}
              setShowPaymentButtons={setShowPaymentButtons}
            />
          </div>
        </section>

        <div className="h-10 md:h-14" />
      </div>
    </div>
  );
}
