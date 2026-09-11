const prisma = require("../prisma");

const DEFAULT_PUBLIC_COURSES = [
  {
    title: "Basic Drone Program",
    description: "Drone fundamentals, basic building, components understanding, flight basics.",
    price: 5000,
    duration: "24 Hours",
    category: "basic",
    features: ["Drone fundamentals", "Basic drone building", "Components understanding", "Flight basics"],
    images: ["B1", "B2", "B3"],
    sortOrder: 10,
    isActive: true
  },
  {
    title: "Fixed Wing Drone",
    description: "Fixed wing design, aerodynamics basics, assembly and testing, flight control concepts.",
    price: 10000,
    duration: "40 Hours",
    category: "moderate",
    features: ["Fixed wing drone design", "Aerodynamics basics", "Assembly & testing", "Flight control concepts"],
    images: ["F1", "F2", "F3"],
    sortOrder: 20,
    isActive: true
  },
  {
    title: "Multicopter Drone",
    description: "Multicopter design, lift & propulsion basics, assembly and testing, flight control concepts.",
    price: 10000,
    duration: "40 Hours",
    category: "moderate",
    features: ["Multicopter drone design", "Lift & propulsion basics", "Assembly & testing", "Flight control concepts"],
    images: ["M1", "M2", "M3"],
    sortOrder: 30,
    isActive: true
  },
  {
    title: "AI in Drone",
    description: "AI fundamentals in drones, computer vision basics, autonomous flight concepts, applications.",
    price: 10000,
    duration: "40 Hours",
    category: "moderate",
    features: ["AI fundamentals in drones", "Computer vision basics", "Autonomous flight concepts", "Real-world applications"],
    images: ["A1", "A2"],
    sortOrder: 40,
    isActive: true
  },
  {
    title: "Frame Designing for UAVs",
    description: "Specialized training for advanced design workflows and long-term UAV frame design.",
    price: 25000,
    duration: "12 months",
    category: "advance",
    features: ["Frame design fundamentals", "Material selection", "Strength & stability considerations", "Design validation workflow"],
    images: ["FD1", "FD2", "FD3"],
    sortOrder: 50,
    isActive: true
  }
];

async function ensurePublicCourses() {
  const activeCount = await prisma.course.count({ where: { isActive: true } });
  if (activeCount > 0) return;
  await prisma.course.createMany({ data: DEFAULT_PUBLIC_COURSES });
}

async function listPublicCourses(req, res) {
  await ensurePublicCourses();

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      duration: true,
      category: true,
      features: true,
      images: true
    }
  });

  return res.json({ courses });
}

module.exports = { listPublicCourses };
