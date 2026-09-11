import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, ShieldCheck, X } from "lucide-react";
import type { Course } from "./types";
import { getCourseImages, getCourseMoreInfo } from "./courseContent";
import { getDiscountInr, getPayableInr, inr } from "./utils";

function AutoScrollImages({
  images,
  altBase,
  aspectClassName = "aspect-[1360/768]",
}: {
  images: string[];
  altBase: string;
  aspectClassName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    const update = () => setPageWidth(element.clientWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(element);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = window.setInterval(() => setIndex((prev) => (prev + 1) % images.length), 4500);
    return () => window.clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element || !pageWidth) return;
    element.scrollTo({ left: index * pageWidth, behavior: "smooth" });
  }, [index, pageWidth]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black/18 ${aspectClassName}`}>
      <div
        ref={scrollerRef}
        className="h-full w-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: "none" as any }}
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="snap-start shrink-0 w-full h-full">
            <img
              src={src}
              alt={`${altBase} ${i + 1}`}
              className="w-full h-full object-cover object-center cardImage"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseCard({
  course,
  onEnroll,
  isMoreOpen,
  onToggleMore,
}: {
  course: Course;
  onEnroll: (course: Course) => void;
  isMoreOpen: boolean;
  onToggleMore: () => void;
}) {
  const discountInr = getDiscountInr(course.pricing.originalInr, course.pricing.discountPercent);
  const payableInr = getPayableInr(course.pricing.originalInr, course.pricing.discountPercent);
  const hasDiscount = discountInr > 0;
  const images = useMemo(() => getCourseImages(course), [course]);
  const objectiveItems = useMemo(() => course.features.slice(0, 4), [course.features]);

  return (
    <article className="glass rounded-2xl p-7 md:p-8 flex flex-col shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.28)] transition-shadow duration-200">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/85 uppercase">
          {course.category}
        </span>
        <ShieldCheck size={16} className="text-[#D4AF37]" />
      </div>

      <h3 className="mt-4 text-xl md:text-2xl font-semibold headingText line-clamp-2 min-h-[3.25rem]">
        {course.title}
      </h3>

      <div className="mt-4">
        <AutoScrollImages images={images} altBase={course.title} />
      </div>

      <div className="mt-4 min-h-[2.75rem]">
        {course.description?.trim() && (
          <p className="text-sm md:text-base leading-relaxed text-white/78 line-clamp-2">
            {course.description.trim()}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-black/18 px-3 py-3 border border-white/10">
          <p className="text-white/58">Duration</p>
          <p className="mt-1 font-semibold text-white">{course.duration}</p>
        </div>
        <div className="rounded-xl bg-black/18 px-3 py-3 border border-white/10">
          <p className="text-white/58">Price</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 min-h-[2.25rem]">
            <span className="font-semibold text-white">{inr(payableInr)}</span>
            {hasDiscount && (
              <>
                <span className="text-white/60 line-through">{inr(course.pricing.originalInr)}</span>
                <span className="text-[#D4AF37] font-semibold">-{course.pricing.discountPercent}%</span>
              </>
            )}
            {!hasDiscount && <span className="opacity-0 select-none">placeholder</span>}
          </div>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-white/72 min-h-[108px] content-start">
        {objectiveItems.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
            <span>{feature}</span>
          </li>
        ))}
        {Array.from({ length: Math.max(0, 4 - objectiveItems.length) }).map((_, idx) => (
          <li key={`obj-pad-${course.id}-${idx}`} className="flex items-start gap-2.5 opacity-0 select-none">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <span>placeholder</span>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onToggleMore} className="mt-5 inline-flex items-center gap-2 font-bold">
        <Info size={18} className="text-white/90" />
        <span className="goldParticle">{isMoreOpen ? "Hide info" : "More info"}</span>
      </button>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => onEnroll(course)}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm md:text-base font-semibold transition-all duration-200 focus:outline-none bg-[#D4AF37] text-black shadow-sm hover:bg-[#e5c96d] hover:shadow-md hover:scale-[1.03]"
        >
          Enroll Now
        </button>
      </div>
    </article>
  );
}

function CourseMorePanel({ course, onClose }: { course: Course; onClose: () => void }) {
  const more = getCourseMoreInfo(course);
  const images = getCourseImages(course);
  const payableInr = getPayableInr(course.pricing.originalInr, course.pricing.discountPercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 10, height: 0 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="overflow-visible"
    >
      <div className="relative z-10 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="px-6 md:px-10">
          <div className="expandWide rounded-3xl p-7 md:p-10 w-full">
        <div className="sectionTitleRow">
          <div className="sectionTitle">
            <span className="goldParticle">{more.moreTitle}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-black/20 border border-white/15 p-2 hover:bg-black/30 transition"
            aria-label="Show less"
          >
            <X size={18} className="text-white/85" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="max-w-4xl mx-auto">
              <AutoScrollImages images={images} altBase={`${course.title} preview`} aspectClassName="aspect-[1360/768]" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm max-w-4xl mx-auto">
              <div className="rounded-xl bg-black/18 px-3 py-3 border border-white/10">
                <p className="text-white/58">Duration</p>
                <p className="mt-1 font-semibold text-white">{course.duration}</p>
              </div>
              <div className="rounded-xl bg-black/18 px-3 py-3 border border-white/10">
                <p className="text-white/58">Price</p>
                <p className="mt-1 font-semibold text-white">{inr(payableInr)}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {more.points.map((point) => (
                <div key={point.title} className="pointBox rounded-2xl p-5 md:p-6">
                  <h4 className="text-base md:text-lg font-extrabold goldParticle">{point.title}</h4>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-white/82">{point.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="explainBox rounded-2xl p-5 md:p-6 h-full">
              <div className="text-sm uppercase tracking-wide text-white/60 font-bold">Summary</div>
              <p className="mt-3 text-base md:text-lg leading-relaxed text-white/88">{more.summary}</p>
              <button type="button" onClick={onClose} className="mt-5 inline-flex items-center gap-2 font-extrabold">
                <span className="goldParticle">Show less</span>
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CoursesSection({
  courses,
  coursesLoading,
  onEnroll,
}: {
  courses: Course[];
  coursesLoading: boolean;
  onEnroll: (course: Course) => void;
}) {
  const [openCourseMoreId, setOpenCourseMoreId] = useState<string | null>(null);

  const orderedCourses = useMemo(() => {
    const weight = (c: Course) => (c.category === "Basic" ? 0 : c.category === "Moderate" ? 1 : 2);
    return [...courses].sort((a, b) => weight(a) - weight(b));
  }, [courses]);

  const openCourse = openCourseMoreId ? orderedCourses.find((c) => c.id === openCourseMoreId) : null;

  return (
    <section id="courses" className="mt-10 md:mt-12">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-semibold headingText">Courses</h2>
        <p className="mt-3 text-sm md:text-base text-white/72">Structured programs for beginners and growth-stage learners.</p>
      </div>

      <div className="mt-8 glass rounded-2xl p-6 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold headingText">Training Programs</h3>
            <p className="mt-2 text-sm md:text-base text-white/72">Hands-on practical learning | Industry-relevant skills</p>
          </div>
          <div />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-7">
          {coursesLoading && <div className="text-white/70 text-sm">Loading courses...</div>}
          {!coursesLoading && orderedCourses.length === 0 && <div className="text-white/70 text-sm">No courses available right now.</div>}
          {!coursesLoading &&
            orderedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={onEnroll}
                isMoreOpen={openCourseMoreId === course.id}
                onToggleMore={() => setOpenCourseMoreId((prev) => (prev === course.id ? null : course.id))}
              />
            ))}
        </div>
      </div>

      <div className="mt-10 relative overflow-visible">
        <AnimatePresence>
          {openCourse && <CourseMorePanel course={openCourse} onClose={() => setOpenCourseMoreId(null)} />}
        </AnimatePresence>
      </div>
    </section>
  );
}
