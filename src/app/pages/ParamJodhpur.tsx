import { motion } from "motion/react";
import "@/styles/param.css";

export function ParamJodhpur() {
  return (
    <div className="param-page min-h-screen pt-24">
      <div className="param-content">
        <section className="px-6 pt-12 pb-10 md:pt-14 md:pb-12">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
                <span className="whiteWithGoldOutline">PARAM Jodhpur</span>
              </h1>
              <p className="mt-4 text-lg md:text-2xl font-semibold headingText">
                Drone Training &amp; Development Center
              </p>
              <p className="mt-2 text-sm md:text-base text-white/72">
                Learn, Build, and Innovate with Drone Technology
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
