import { DRONE_IMAGES } from "@/app/constants/droneImages";

export type ParamCardId = "rd" | "inst";

export type ParamCenter = {
  id: string;
  label: string;
  mapsUrl: string;
  modalTitle: { city: string };
  address: string;
};

export type ParamPoint = {
  title: string;
  description: string;
};

export type ParamCard = {
  id: ParamCardId;
  title: string;
  subtitle: string;
  image: string;
  moreTitle: string;
  summary: string;
  points: ParamPoint[];
};

export const PARAM_CENTERS: ParamCenter[] = [
  {
    id: "param-jodhpur",
    label: "Param-Jodhpur",
    mapsUrl: "https://maps.app.goo.gl/NcXH6bAMUzAp7s5V9",
    modalTitle: { city: "Jodhpur" },
    address: "iStart Nest Incubation Center Gov. Polytechnic College , Jodhpur",
  },
];

export const PARAM_CARDS: ParamCard[] = [
  {
    id: "rd",
    title: "Research & Development",
    subtitle:
      "UAV design, prototyping, testing, validation, and rapid iteration.",
    image: DRONE_IMAGES.RD,
    moreTitle: "Research & Development",
    summary:
      "R&D is the primary mission of PARAM: designing, engineering, prototyping, and validating UAV platforms with real-world testing and rapid iteration.",
    points: [
      {
        title: "UAV Design & Engineering",
        description:
          "Airframe design, payload integration, component selection, and engineering trade-offs to meet mission needs.",
      },
      {
        title: "Prototyping & Iteration",
        description:
          "Rapid builds, refinements, and improvements based on stability, endurance, and reliability targets.",
      },
      {
        title: "Flight Control & Autonomy",
        description:
          "Tuning flight controllers, autonomy behavior, navigation workflows, and safe failsafes.",
      },
      {
        title: "Validation & Testing",
        description:
          "System checks, field tests, and real-world evaluation to mature prototypes into deployable systems.",
      },
    ],
  },
  {
    id: "inst",
    title: "Institutional / Training",
    subtitle:
      "Learn how drones work, how to build them, and how to fly safely.",
    image: DRONE_IMAGES.L,
    moreTitle: "Institutional & Training",
    summary:
      "Institutional training is the secondary mission: structured skill development to teach drone building, safe flying, and professional operational discipline.",
    points: [
      {
        title: "How to Build Drones",
        description:
          "Components, assembly workflow, wiring, calibration, and clean builds that actually fly reliably.",
      },
      {
        title: "How to Fly Safely",
        description:
          "Pre-flight checks, safe flying habits, emergency handling, and professional operating discipline.",
      },
      {
        title: "Skill Development Programs",
        description:
          "Structured learning to build real capability and create a strong talent pipeline for PARAM labs.",
      },
      {
        title: "Compliance & Responsibility",
        description:
          "Responsible operation practices that reduce risk and improve safety and professionalism.",
      },
    ],
  },
];
