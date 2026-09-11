import { motion } from "motion/react";
import { ProductCard } from "@/app/components/Cards";
import { PrimaryButton } from "@/app/components/Buttons";
import { useAuth } from "@/app/contexts/AuthContext";
import { Shield, Package, Layers, Zap } from "lucide-react";
import { DRONE_IMAGES } from "@/app/constants/droneImages";

export function Defence() {
  const { openAuthModal } = useAuth();

  const products = [
    {
      title: "Anti-Drone Technology",
      description:
        "Advanced detection and monitoring systems for real-time threat identification and response.",
      image: DRONE_IMAGES.AI,
    },
    {
      title: "Combat UAVs",
      description:
        "Mission-focused platforms designed for tactical operations with autonomous capabilities.",
      image: DRONE_IMAGES.OCTACOPTER,
    },
    {
      title: "High-Altitude Long Endurance (HALE) UAV",
      description:
        "Strategic aerial platforms operating above 60,000 feet with extended endurance.",
      image: DRONE_IMAGES.HALE,
    },
    {
      title: "SWARM UAV",
      description:
        "Networked systems coordinating multiple UAVs as a single intelligent unit.",
      image: DRONE_IMAGES.SWARM,
    },
  ];

  const philosophy = [
    {
      icon: <Shield size={32} />,
      title: "Indigenous Development",
      description: "Technology sovereignty with in-house R&D and engineering.",
    },
    {
      icon: <Package size={32} />,
      title: "Modular Architecture",
      description: "Scalable platforms enabling rapid mission customization.",
    },
    {
      icon: <Layers size={32} />,
      title: "Proven Reliability",
      description: "Rigorous validation for defence-grade performance.",
    },
    {
      icon: <Zap size={32} />,
      title: "Rapid Deployment",
      description: "Fast transition from requirement to operational capability.",
    },
  ];

  return (
    <div className="defence-page min-h-screen pt-24">
      <style>{`
        .defence-page{
          /* Shiny blood red */
          background:
            #0F2854;
        }

        /* Desktop/tablet: outline (nice on big text) */
        .defence-stroke{
          color: #0b0b0b;
          -webkit-text-stroke: 1.6px #FFD700;
          text-shadow: 0 0 16px rgba(255,215,0,0.18);
        }

        /* ✅ Mobile: black fill + gold outline WITHOUT text-stroke (Android-safe) */
        @media (max-width: 640px){
          .defence-stroke{
            -webkit-text-stroke: 0px transparent; /* keep disabled */
            color: #0b0b0b; /* black fill like desktop */
            text-shadow:
              /* gold outline ring */
              2px 0   rgba(255,215,0,0.95),
             -2px 0   rgba(255,215,0,0.95),
              0   2px rgba(255,215,0,0.95),
              0  -2px rgba(255,215,0,0.95),
              2px 2px rgba(255,215,0,0.95),
             -2px -2px rgba(255,215,0,0.95),
              2px -2px rgba(255,215,0,0.95),
             -2px 2px rgba(255,215,0,0.95),

              /* soft glow */
              0 0 14px rgba(255,215,0,0.22),
              0 10px 28px rgba(0,0,0,0.45);
          }
        }

        .defence-gold{
          color: rgba(255, 219, 128, 0.95);
        }

        .defence-card{
          background: rgba(12, 8, 10, 0.34);
          border: 1px solid rgba(255, 215, 0, 0.20);
          box-shadow: 0 18px 55px rgba(0,0,0,0.42);
          backdrop-filter: blur(10px);
        }

        .defence-page .defence-products h3{
          color: rgba(255, 219, 128, 0.98) !important;
          font-weight: 800 !important;
        }
        .defence-page .defence-products p{
          color: rgba(255, 219, 128, 0.86) !important;
          font-weight: 600 !important;
        }

        .defence-page .defence-philosophy h4{
          color: rgba(255, 219, 128, 0.98) !important;
          font-weight: 800 !important;
        }
        .defence-page .defence-philosophy p{
          color: rgba(255, 219, 128, 0.86) !important;
          font-weight: 600 !important;
        }

        .defence-page .defence-icon{
          color: #FFD700;
          filter: drop-shadow(0 0 10px rgba(255,215,0,0.22));
        }
      `}</style>

      {/* Hero */}
      <section className="py-16 sm:py-20 md:py-24 px-5 sm:px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-extrabold tracking-tight leading-[1.05] mb-4 text-[2.2rem] sm:text-5xl md:text-6xl"
        >
          <span className="defence-stroke block sm:inline">Defence-Grade</span>{" "}
          <span className="defence-stroke block sm:inline">Aerial Solutions</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-base sm:text-lg md:text-2xl font-semibold max-w-[46ch] mx-auto"
        >
          <span className="defence-gold">
            Mission-critical platforms for security and defence
          </span>
        </motion.p>

        <div className="mt-8 sm:mt-10 flex justify-center">
          <div className="h-px w-32 sm:w-40 md:w-48 bg-gradient-to-r from-transparent via-[#FFD700]/70 to-transparent shadow-[0_0_12px_rgba(255,215,0,0.35)]" />
        </div>
      </section>

      {/* Products */}
      <section className="defence-products py-14 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-10 sm:mb-12 text-center leading-tight"
          >
            <span className="defence-stroke">Our Solutions</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="defence-card rounded-2xl overflow-hidden"
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="defence-philosophy py-14 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-10 sm:mb-12 text-center leading-tight"
          >
            <span className="defence-stroke">Design Philosophy</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {philosophy.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="defence-card p-6 rounded-2xl text-center"
              >
                <div className="flex justify-center mb-4 defence-icon">
                  {item.icon}
                </div>
                <h4 className="mb-2 text-lg">{item.title}</h4>
                <p className="text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-5 leading-tight"
          >
            <span className="defence-stroke block sm:inline">Discuss Your</span>{" "}
            <span className="defence-stroke block sm:inline">Requirements</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-base sm:text-lg md:text-xl font-semibold mb-8 sm:mb-10 max-w-[52ch] mx-auto"
          >
            <span className="defence-gold">
              Contact us to explore how our solutions can meet your needs
            </span>
          </motion.p>

          <div className="flex justify-center">
            <PrimaryButton onClick={openAuthModal} className="!px-8 !py-3">
              <span className="defence-gold font-bold">Request Consultation</span>
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
}
