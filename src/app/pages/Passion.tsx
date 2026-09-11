import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Lightbulb, Cog, Rocket, Shield } from 'lucide-react';
import { PrimaryButton } from '@/app/components/Buttons';
import { useAuth } from '@/app/contexts/AuthContext';

export function Passion() {
  const { openAuthModal } = useAuth();

  const values = [
    {
      icon: <Lightbulb size={48} />,
      title: 'Innovation Mindset',
      description: 'Constantly pushing boundaries to develop next-generation drone technology and AI systems',
      color: 'text-yellow-600',
    },
    {
      icon: <Cog size={48} />,
      title: 'Engineering Curiosity',
      description: 'Deep technical exploration and problem-solving drive our approach to every challenge',
      color: 'text-blue-600',
    },
    {
      icon: <Rocket size={48} />,
      title: 'Building Future Capability',
      description: 'Creating indigenous technology that strengthens national self-reliance and capabilities',
      color: 'text-purple-600',
    },
    {
      icon: <Shield size={48} />,
      title: 'Responsible Technology',
      description: 'Committed to ethical development and deployment of defence and surveillance systems',
      color: 'text-green-600',
    },
  ];

  return (
    <div
      className="
        min-h-screen pt-24
        bg-[linear-gradient(to_bottom,#0B0F1A_0%,#0F2A44_22%,#F5F7FA_50%,#0F2A44_78%,#08101F_100%)]
      "
    >
      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl mb-6 text-neutral-100"
        >
          Driven by Passion
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-neutral-200/90"
        >
          Built with Purpose
        </motion.p>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ delay: index * 0.1 }}
                className="p-10 bg-white/20 dark:bg-neutral-900/30 backdrop-blur-lg rounded-3xl border border-white/20 dark:border-neutral-800/40 transition-all duration-300 cursor-pointer"
              >
                <div className={`mb-6 ${value.color}`}>{value.icon}</div>
                <h3 className="text-2xl mb-4 text-neutral-900 dark:text-neutral-100">{value.title}</h3>
                <p className="text-lg text-neutral-800/90 dark:text-neutral-300 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Links Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl mb-16 text-center text-neutral-900 dark:text-neutral-100"
          >
            Explore More
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link to="/aerolab">
                <div className="p-12 bg-white/20 dark:bg-neutral-900/30 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-neutral-800/40 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                  <h3 className="text-3xl mb-4 text-neutral-900 dark:text-neutral-100 group-hover:scale-105 transition-transform">
                    Explore Aerolab
                  </h3>
                  <p className="text-lg text-neutral-800/90 dark:text-neutral-300">
                    Join our educational initiative to learn, build, and innovate in drone technology
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Link to="/careers">
                <div className="p-12 bg-white/20 dark:bg-neutral-900/30 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-neutral-800/40 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                  <h3 className="text-3xl mb-4 text-neutral-900 dark:text-neutral-100 group-hover:scale-105 transition-transform">
                    Careers
                  </h3>
                  <p className="text-lg text-neutral-800/90 dark:text-neutral-300">
                    Be part of a team building the future of indigenous drone technology
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl mb-6 text-neutral-100"
          >
            Be Part of the Mission
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-200/90 mb-12"
          >
            Join us in building cutting-edge drone technology and AI systems
          </motion.p>
          <PrimaryButton onClick={openAuthModal}>Get in Touch</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
