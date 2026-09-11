import { motion } from 'motion/react';
import { PrimaryButton } from '@/app/components/Buttons';
import { Code, Cpu, Wrench, Rocket } from 'lucide-react';
import { useState } from 'react';

export function Careers() {
  const [showApply, setShowApply] = useState(false);

  const roles = [
    {
      icon: <Code size={32} />,
      title: 'Software Engineers',
      description: 'Developers working on flight controllers, AI systems, and autonomous navigation',
    },
    {
      icon: <Cpu size={32} />,
      title: 'AI Researchers',
      description: 'Experts in computer vision, machine learning, and intelligent systems',
    },
    {
      icon: <Wrench size={32} />,
      title: 'Hardware Engineers',
      description: 'Specialists in drone design, electronics, and mechanical systems',
    },
    {
      icon: <Rocket size={32} />,
      title: 'Drone Enthusiasts',
      description: 'Passionate individuals eager to contribute to indigenous drone technology',
    },
  ];

  return (
    <div className="min-h-screen pt-24">
      {/* Hero */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-green-50 to-white dark:from-neutral-950 dark:to-black">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl mb-6"
        >
          Careers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-neutral-600 dark:text-neutral-400"
        >
          Join the Future of Aerial Vehicle Technology.
        </motion.p>
      </section>

      {/* Who We Look For */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl mb-6"
          >
            Who We Look For
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed"
          >
            We're building a team of exceptional engineers, researchers, and innovators who are 
            passionate about creating cutting-edge drone technology and AI systems.
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="text-green-600 mb-4">{role.icon}</div>
              <h3 className="text-xl mb-3">{role.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What You'll Work On */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl mb-6"
          >
            What You'll Work On
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed"
          >
            <p>
              Work on defence-grade drone platforms, anti-drone systems, and autonomous flight technologies
            </p>
            <p>
              Develop AI and computer vision systems for real-time detection and intelligent decision-making
            </p>
            <p>
              Contribute to indigenous technology development with complete design and manufacturing control
            </p>
            <p>
              Collaborate with a talented team on mission-critical projects with real-world impact
            </p>
          </motion.div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl mb-6"
          >
            How to Apply
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 mb-8"
          >
            Send your resume and portfolio to:
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <a 
              href="mailto:rigvaimanikitechnologies@gmail.com"
              className="text-2xl text-blue-600 hover:text-blue-700 transition-colors"
            >
              rigvaimanikitechnologies@gmail.com
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <PrimaryButton onClick={() => setShowApply(true)}>Apply Now</PrimaryButton>
          </motion.div>
        </div>
      </section>

      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowApply(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xl font-semibold">Apply to Rigvaimaniki</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Send your resume here:
            </p>
            <a
              href="mailto:rigvaimanikitechnologies@gmail.com?subject=Resume%20Application"
              className="mt-3 inline-block text-blue-600 hover:text-blue-700"
            >
              rigvaimanikitechnologies@gmail.com
            </a>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
