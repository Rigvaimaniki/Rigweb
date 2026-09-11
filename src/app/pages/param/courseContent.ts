import { DRONE_IMAGES } from "@/app/constants/droneImages";
import type { Course } from "./types";

export function getCourseImages(course: Course): string[] {
  const title = (course.title || "").toLowerCase();

  // If images are stored in the course record, prefer them.
  if ((course as any).images && Array.isArray((course as any).images) && (course as any).images.length > 0) {
    // map stored keys/urls to actual image imports when possible
    const mapped = (course as any).images
      .map((k: string) => {
        if (!k) return null;
        const key = String(k).toUpperCase();
        // @ts-ignore
        return (DRONE_IMAGES as any)[key] || k;
      })
      .filter(Boolean);
    return mapped.slice(0, 3);
  }

  // Explicit mappings for courses requested by the designer
  if (title.includes("frame") || title.includes("fram")) {
    return [DRONE_IMAGES.FD1, DRONE_IMAGES.FD2, DRONE_IMAGES.FD3];
  }

  if (title.includes("multicopter") || title.includes("multi") || title.includes("multirotor") || title.includes("quad")) {
    return [DRONE_IMAGES.M1, DRONE_IMAGES.M2, DRONE_IMAGES.M3];
  }

  if (title.includes("fixed wing") || title.includes("fixed-wing") || title.includes("vtol") || title.includes("fixedwing")) {
    return [DRONE_IMAGES.F1, DRONE_IMAGES.F2, DRONE_IMAGES.F3];
  }

  if (title.includes("basic") || title.includes("basic drone") || title.includes("basic program")) {
    return [DRONE_IMAGES.B1, DRONE_IMAGES.B2, DRONE_IMAGES.B3];
  }

  if (title.includes("ai") || title.includes("ml") || title.includes("vision") || title.includes("autonomy")) {
    return [DRONE_IMAGES.A1, DRONE_IMAGES.A2];
  }

  // Fallback behaviour: keep previous heuristic but limit to 3 images
  const byKeyword: string[] = [];
  if (title.includes("vtol") || title.includes("fixed wing") || title.includes("fixed-wing")) byKeyword.push(DRONE_IMAGES.VTOL);
  if (title.includes("swarm") || title.includes("formation")) byKeyword.push(DRONE_IMAGES.SWARM);
  if (title.includes("octa") || title.includes("octocopter")) byKeyword.push(DRONE_IMAGES.OCTACOPTER);
  if (title.includes("multi") || title.includes("quad") || title.includes("multirotor")) byKeyword.push(DRONE_IMAGES.MULTIROTOR);
  if (title.includes("research") || title.includes("r&d") || title.includes("rd")) byKeyword.push(DRONE_IMAGES.RD);

  const byCategory =
    course.category === "Advance"
      ? [DRONE_IMAGES.SWARM, DRONE_IMAGES.HALE, DRONE_IMAGES.RD]
      : course.category === "Moderate"
        ? [DRONE_IMAGES.VTOL, DRONE_IMAGES.AI, DRONE_IMAGES.MULTIROTOR]
        : [DRONE_IMAGES.MULTIROTOR, DRONE_IMAGES.OCTACOPTER, DRONE_IMAGES.L];

  const unique: string[] = [];
  for (const src of [...byKeyword, ...byCategory, DRONE_IMAGES.MULTIROTOR, DRONE_IMAGES.OCTACOPTER, DRONE_IMAGES.VTOL]) {
    if (!unique.includes(src)) unique.push(src);
    if (unique.length >= 3) break;
  }

  return unique.slice(0, 3);
}

export function getCourseMoreInfo(course: Course) {
  const extraSummary =
    "The training is designed to be clear, structured, and outcome-focused — with emphasis on safety, repeatability, and good engineering habits. You’ll build confidence through step-by-step workflows, common failure patterns, and practical decision-making that transfers to real projects.";

  const base = {
    moreTitle: `More about ${course.title}`,
    summary:
      `A practical, industry-aligned program built around real build-and-test workflows, safe operations, and engineering discipline. You’ll learn how to approach drones like a professional: follow checklists, validate changes, and troubleshoot issues with a clear process (not guesswork). By the end, you’ll be confident in planning a build, configuring it correctly, verifying stability, and identifying the root-cause when something doesn’t behave as expected. ${extraSummary}`,
    points: [
      {
        title: "Ideal for",
        description:
          course.category === "Basic"
            ? "Beginners, students, and hobbyists who want a structured start in drone systems, components, and safe flight habits."
            : course.category === "Moderate"
              ? "Learners who know the basics and want to progress into setup, tuning, troubleshooting, and mission-ready workflows."
              : "Advanced learners and builders who want deeper design thinking, validation practice, and performance-oriented workflows.",
      },
      {
        title: "Training focus",
        description:
          course.category === "Basic"
            ? "Core foundations: airframe & electronics overview, configuration basics, safe handling, and repeatable pre-flight / pre-arm checks."
            : course.category === "Moderate"
              ? "Skill-building depth: a tuning approach, stability & control basics, common failures, and habits that improve reliability."
              : "Professional depth: performance trade-offs, robust validation, safety margins, and structured troubleshooting under constraints.",
      },
      {
        title: "Deliverables",
        description:
          "A clear learning path, repeatable checklists, and a solid understanding of how a drone goes from parts to flight-ready, tested, and stable.",
      },
      {
        title: "Pre-requisites",
        description:
          course.category === "Basic"
            ? "No prior experience required. Curiosity and willingness to learn is enough."
            : course.category === "Moderate"
              ? "Comfort with basic components, flight basics, and common terms (ESC, FC, calibration)."
              : "Strong fundamentals and the ability to learn independently between sessions.",
      },
    ],
  };

  if (course.description?.trim()) {
    return {
      ...base,
      summary: `${course.description.trim()} ${extraSummary}`,
    };
  }

  return base;
}
