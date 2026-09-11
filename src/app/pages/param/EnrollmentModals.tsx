import type { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import type { Course } from "./types";
import { getDiscountInr, getPayableInr, inr } from "./utils";

export function EnrollmentModals({
  courses,
  showCourseSelect,
  setShowCourseSelect,
  billingCourse,
  setBillingCourse,
  selectedCourse,
  setSelectedCourse,
  billingInfo,
  setBillingInfo,
  billingError,
  setBillingError,
  enrollmentData,
  setEnrollmentData,
  paying,
  payError,
  beginPayment,
  proceedFromBilling,
  onEnroll,
  enrollmentSuccess,
  setEnrollmentSuccess,
  showPaymentButtons,
  setShowPaymentButtons,
}: {
  courses: Course[];
  showCourseSelect: boolean;
  setShowCourseSelect: Dispatch<SetStateAction<boolean>>;
  billingCourse: Course | null;
  setBillingCourse: Dispatch<SetStateAction<Course | null>>;
  selectedCourse: Course | null;
  setSelectedCourse: Dispatch<SetStateAction<Course | null>>;
  billingInfo: { name: string; mobile: string } | null;
  setBillingInfo: Dispatch<SetStateAction<{ name: string; mobile: string } | null>>;
  billingError: string | null;
  setBillingError: Dispatch<SetStateAction<string | null>>;
  enrollmentData: {
    firstName: string;
    lastName: string;
    gender: string;
    mobile: string;
    email: string;
    dateOfBirth: string;
    city: string;
    state: string;
    preferredBatch: string;
    experienceLevel: string;
    profession: string;
    college: string;
    agreedToFollowUp: boolean;
  };
  setEnrollmentData: Dispatch<
    SetStateAction<{
      firstName: string;
      lastName: string;
      gender: string;
      mobile: string;
      email: string;
      dateOfBirth: string;
      city: string;
      state: string;
      preferredBatch: string;
      experienceLevel: string;
      profession: string;
      college: string;
      agreedToFollowUp: boolean;
    }>
  >;
  paying: boolean;
  payError: string | null;
  beginPayment: () => Promise<void>;
  proceedFromBilling: () => Promise<void>;
  onEnroll: (course: Course) => void;
  enrollmentSuccess: string | null;
  setEnrollmentSuccess: Dispatch<SetStateAction<string | null>>;
  showPaymentButtons: boolean;
  setShowPaymentButtons: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <AnimatePresence>
        {(showCourseSelect || billingCourse || selectedCourse) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCourseSelect(false);
                setBillingCourse(null);
                setBillingError(null);
                setSelectedCourse(null);
                setBillingInfo(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {showCourseSelect && !selectedCourse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-7 relative">
                  <button
                    type="button"
                    onClick={() => setShowCourseSelect(false)}
                    className="absolute top-5 right-5 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  <h3 className="text-xl font-semibold">Select a course</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Prices include the current discount where applicable.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    {courses.map((course) => {
                      const payableInr = getPayableInr(course.pricing.originalInr, course.pricing.discountPercent);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setShowCourseSelect(false);
                            onEnroll(course);
                          }}
                          className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">{course.title}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">{course.category}</div>
                            </div>
                            <div className="shrink-0 font-semibold">{inr(payableInr)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {billingCourse && !selectedCourse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-7 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCourse(null);
                      setBillingError(null);
                    }}
                    className="absolute top-5 right-5 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  <h3 className="text-xl font-semibold">Course Enrollment</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Please fill in all the required details to enroll in this course.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Course</label>
                      <select
                        value={billingCourse.id}
                        onChange={(e) => {
                          const next = courses.find((course) => course.id === e.target.value) || null;
                          if (next) setBillingCourse(next);
                        }}
                        className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                      >
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                        <span>
                          {billingCourse.category} • {billingCourse.duration}
                        </span>
                        <span className="font-semibold">
                          {inr(getPayableInr(billingCourse.pricing.originalInr, billingCourse.pricing.discountPercent))}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name *</label>
                        <input
                          value={enrollmentData.firstName}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Your first name"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name *</label>
                        <input
                          value={enrollmentData.lastName}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Your last name"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date of Birth *</label>
                        <input
                          type="date"
                          value={enrollmentData.dateOfBirth}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gender *</label>
                        <select
                          value={enrollmentData.gender}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, gender: e.target.value }))}
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <input
                          type="email"
                          value={enrollmentData.email}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="your.email@example.com"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mobile Number *</label>
                        <input
                          type="tel"
                          value={enrollmentData.mobile}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, mobile: e.target.value }))}
                          placeholder="+91 9876543210"
                          inputMode="numeric"
                          autoComplete="tel"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">City *</label>
                        <input
                          value={enrollmentData.city}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="Your city"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">State *</label>
                        <input
                          value={enrollmentData.state}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="Your state"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred Batch *</label>
                      <select
                        value={enrollmentData.preferredBatch}
                        onChange={(e) => setEnrollmentData((prev) => ({ ...prev, preferredBatch: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                      >
                        <option value="">Select preferred batch</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experience Level *</label>
                      <select
                        value={enrollmentData.experienceLevel}
                        onChange={(e) => setEnrollmentData((prev) => ({ ...prev, experienceLevel: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                      >
                        <option value="">Select experience level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profession *</label>
                        <input
                          value={enrollmentData.profession}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, profession: e.target.value }))}
                          placeholder="Student / Working professional"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">College / Organization *</label>
                        <input
                          value={enrollmentData.college}
                          onChange={(e) => setEnrollmentData((prev) => ({ ...prev, college: e.target.value }))}
                          placeholder="College or organization name"
                          className="w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={enrollmentData.agreedToFollowUp}
                        onChange={(e) => setEnrollmentData((prev) => ({ ...prev, agreedToFollowUp: e.target.checked }))}
                        className="mt-1.5"
                      />
                      <div className="text-sm text-neutral-700 dark:text-neutral-300">
                        I agree to be contacted for course updates and follow-up.
                      </div>
                    </div>

                    {billingError && (
                      <div className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                        {billingError}
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingCourse(null);
                          setBillingError(null);
                        }}
                        className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void proceedFromBilling()}
                        disabled={paying}
                        className="flex-1 h-11 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#e5c96d] transition-colors disabled:opacity-50"
                      >
                        {paying ? "Processing..." : "Enroll"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedCourse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-7 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(null);
                      setBillingInfo(null);
                    }}
                    className="absolute top-5 right-5 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  {(() => {
                    const discountInr = getDiscountInr(selectedCourse.pricing.originalInr, selectedCourse.pricing.discountPercent);
                    const payableInr = getPayableInr(selectedCourse.pricing.originalInr, selectedCourse.pricing.discountPercent);
                    return (
                      <>
                        <h3 className="text-xl font-semibold">Checkout</h3>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{selectedCourse.title}</p>

                        <div className="mt-5 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Original price</span>
                            <span className="font-semibold">{inr(selectedCourse.pricing.originalInr)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Discount</span>
                            <span className="font-semibold">-{inr(discountInr)}</span>
                          </div>
                          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                          <div className="flex items-center justify-between text-base">
                            <span className="font-semibold">Payable</span>
                            <span className="font-semibold">{inr(payableInr)}</span>
                          </div>
                        </div>

                        {payError && (
                          <div className="mt-4 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                            {payError}
                          </div>
                        )}

                        <div className="mt-6 flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourse(null);
                              setBillingInfo(null);
                            }}
                            className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void beginPayment()}
                            disabled={paying}
                            className="flex-1 h-11 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#e5c96d] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {paying ? "Opening..." : "Pay Now"}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enrollmentSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEnrollmentSuccess(null);
                setShowPaymentButtons(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-7 relative">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">Enrollment Successful!</h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{enrollmentSuccess}</p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollmentSuccess(null);
                      setShowPaymentButtons(false);
                    }}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Close
                  </button>
                  {showPaymentButtons && (
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollmentSuccess(null);
                        setShowPaymentButtons(false);
                      }}
                      className="flex-1 h-11 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#e5c96d] transition-colors"
                    >
                      Proceed to Pay (Optional)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

