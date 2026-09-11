import { AnimatePresence, motion } from "motion/react";
import { Info, X } from "lucide-react";
import { PARAM_CARDS, type ParamCardId } from "@/app/constants/paramData";

export function PurposeSection({
  openMore,
  onToggleMore,
  onCloseMore,
}: {
  openMore: ParamCardId | null;
  onToggleMore: (id: ParamCardId) => void;
  onCloseMore: () => void;
}) {
  const selected = openMore ? PARAM_CARDS.find((card) => card.id === openMore) : null;

  return (
    <section className="px-6 py-10 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold headingText">Purpose of PARAM</h2>
          <p className="mt-3 text-base md:text-lg mutedText">
            PARAM operates with two clearly defined objectives, with a strong focus on research and innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {PARAM_CARDS.map((card, index) => (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="glass rounded-3xl overflow-hidden"
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img src={card.image} alt={card.title} className="cardImage w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="p-7 md:p-8">
                <h3 className="text-2xl font-extrabold headingText">{card.title}</h3>
                <p className="mt-3 text-base md:text-lg mutedText">{card.subtitle}</p>

                <button type="button" onClick={() => onToggleMore(card.id)} className="mt-5 inline-flex items-center gap-2 font-bold">
                  <Info size={18} className="text-white/90" />
                  <span className="goldParticle">{openMore === card.id ? "Hide info" : "More info"}</span>
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 md:mt-10">
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 14, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="overflow-visible"
              >
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
                  <div className="px-6 md:px-10">
                    <div className="expandWide rounded-3xl p-8 md:p-12 w-full">
                      <div className="sectionTitleRow">
                        <div className="sectionTitle">
                          <span className="goldParticle">{selected.moreTitle}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={onCloseMore}
                          className="rounded-xl bg-black/20 border border-white/15 p-2 hover:bg-black/30 transition"
                          aria-label="Show less"
                        >
                          <X size={18} className="text-white/85" />
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {selected.points.map((point) => (
                            <div key={point.title} className="pointBox rounded-2xl p-5 md:p-6">
                              <h4 className="text-base md:text-lg font-extrabold goldParticle">{point.title}</h4>
                              <p className="mt-2 text-sm md:text-base leading-relaxed text-white/82">{point.description}</p>
                            </div>
                          ))}
                        </div>

                        <div className="lg:col-span-1">
                          <div className="explainBox rounded-2xl p-5 md:p-6 h-full">
                            <div className="text-sm uppercase tracking-wide text-white/60 font-bold">Summary</div>
                            <p className="mt-3 text-sm md:text-base leading-relaxed text-white/85">{selected.summary}</p>
                            <button type="button" onClick={onCloseMore} className="mt-5 inline-flex items-center gap-2 font-extrabold">
                              <span className="goldParticle">Show less</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

