import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Brain, Radar, Shield } from "lucide-react";

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureCards: FeatureCard[] = [
  {
    icon: Brain,
    title: "Intelligent Processing",
    description:
      "Advanced algorithms for real-time data processing and pattern recognition in complex environments.",
  },
  {
    icon: Radar,
    title: "Detection Systems",
    description:
      "Multi-sensor fusion for comprehensive threat detection and classification capabilities.",
  },
  {
    icon: BarChart3,
    title: "Actionable Insights",
    description:
      "Transform raw data into meaningful intelligence for informed decision-making.",
  },
  {
    icon: Shield,
    title: "Enhanced Security",
    description:
      "Robust security measures ensuring data integrity and system reliability.",
  },
];

const textClass = "text-xl text-neutral-600 leading-relaxed";
const cardClass =
  "p-8 rounded-2xl border border-white/55 bg-white/30 backdrop-blur-md shadow-[0_16px_40px_rgba(97,71,35,0.14)]";

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl mb-6"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className={textClass}
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}

export function AI() {
  return (
    <div className="ai-gradient-bg relative min-h-screen pt-24 overflow-hidden">
      <style>{`
        .ai-gradient-bg{
          background-image:
            linear-gradient(
              145deg,
              #ffffff 0%,
              #ffffff 32%,
              #fdf9f2 43%,
              #ead8b0 58%,
              #e4cb9a 66%,
              #efb4a8 82%,
              #ff8e8e 100%
            ),
            radial-gradient(
              120% 72% at 18% 88%,
              rgba(255, 112, 112, 0.30) 0%,
              rgba(255, 112, 112, 0) 62%
            ),
            radial-gradient(
              120% 72% at 84% 18%,
              rgba(226, 190, 110, 0.12) 0%,
              rgba(226, 190, 110, 0) 58%
            );
          background-size: 200% 200%, 180% 180%, 170% 170%;
          animation: aiCircularLoop 11s linear infinite;
        }

        @keyframes aiCircularLoop {
          0% {
            background-position: 50% 0%, 24% 84%, 78% 20%;
          }
          25% {
            background-position: 100% 50%, 36% 72%, 68% 30%;
          }
          50% {
            background-position: 50% 100%, 46% 60%, 58% 42%;
          }
          75% {
            background-position: 0% 50%, 34% 72%, 72% 28%;
          }
          100% {
            background-position: 50% 0%, 24% 84%, 78% 20%;
          }
        }
      `}</style>
      <div className="relative z-10">
        <section className="py-24 px-6 text-center bg-transparent">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl mb-6"
          >
            <span className="bg-[linear-gradient(to_right,#0B0D12,#44D43B,#7D3CFF,#2D9CFF)] bg-clip-text text-transparent">
              Krit-yan
            </span>{" "}
            <span className="text-[#7D3CFF] drop-shadow-[0_0_8px_rgba(125,60,255,0.6)]">
              AI
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl text-neutral-600 mb-4"
          >
            Intelligence for Drone Ecosystems
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full"
          >
            In Development
          </motion.div>
        </section>

        <SectionIntro
          title="What is Krityan AI?"
          description="Krityan AI is our advanced intelligence platform designed for drone ecosystems. It combines real-time detection, analysis, and decision-making capabilities to enhance operational effectiveness and situational awareness."
        />

        <section className="py-24 px-6 bg-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl mb-16 text-center"
            >
              Why It Matters
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featureCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={cardClass}
                >
                  <card.icon className="text-purple-600 mb-4" size={40} />
                  <h3 className="text-2xl mb-3">{card.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{card.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <SectionIntro
          title="Integrated Solutions"
          description="Krityan AI seamlessly integrates with our defence drone systems and custom platforms, providing a unified intelligence layer that enhances operational capabilities across the entire ecosystem."
        />
      </div>
    </div>
  );
}
