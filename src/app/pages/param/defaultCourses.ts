import type { Course } from "./types";

export const DEFAULT_PARAM_COURSES: Course[] = [
  {
    id: "default-basic-drone-program",
    category: "Basic",
    title: "Basic Drone Program",
    description: "Drone fundamentals, basic building, components understanding, flight basics.",
    duration: "24 Hours",
    features: ["Drone fundamentals", "Basic drone building", "Components understanding", "Flight basics"],
    pricing: { originalInr: 5000, discountPercent: 40 },
    images: ["B1", "B2", "B3"]
  },
  {
    id: "default-fixed-wing-drone",
    category: "Moderate",
    title: "Fixed Wing Drone",
    description: "Fixed wing design, aerodynamics basics, assembly and testing, flight control concepts.",
    duration: "40 Hours",
    features: ["Fixed wing drone design", "Aerodynamics basics", "Assembly & testing", "Flight control concepts"],
    pricing: { originalInr: 10000, discountPercent: 50 },
    images: ["F1", "F2", "F3"]
  },
  {
    id: "default-multicopter-drone",
    category: "Moderate",
    title: "Multicopter Drone",
    description: "Multicopter design, lift & propulsion basics, assembly and testing, flight control concepts.",
    duration: "40 Hours",
    features: ["Multicopter drone design", "Lift & propulsion basics", "Assembly & testing", "Flight control concepts"],
    pricing: { originalInr: 10000, discountPercent: 50 },
    images: ["M1", "M2", "M3"]
  },
  {
    id: "default-ai-in-drone",
    category: "Moderate",
    title: "AI in Drone",
    description: "AI fundamentals in drones, computer vision basics, autonomous flight concepts, applications.",
    duration: "40 Hours",
    features: ["AI fundamentals in drones", "Computer vision basics", "Autonomous flight concepts", "Real-world applications"],
    pricing: { originalInr: 10000, discountPercent: 50 },
    images: ["A1", "A2"]
  },
  {
    id: "default-frame-designing-for-uavs",
    category: "Advance",
    title: "Frame Designing for UAVs",
    description: "Specialized training for advanced design workflows and long-term UAV frame design.",
    duration: "12 months",
    features: ["Frame design fundamentals", "Material selection", "Strength & stability considerations", "Design validation workflow"],
    pricing: { originalInr: 25000, discountPercent: 0 },
    images: ["FD1", "FD2", "FD3"]
  }
];
