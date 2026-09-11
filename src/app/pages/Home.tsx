import { VideoHero } from '@/app/components/VideoHero';
import { ProductCard, CapabilityCard } from '@/app/components/Cards';
import { PrimaryButton, SecondaryButton } from '@/app/components/Buttons';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Cpu, Radio, Shield, Zap, Target, Package } from 'lucide-react';
import { DRONE_IMAGES } from '@/app/constants/droneImages';

export function Home() {
  const navigate = useNavigate();

  const heroImages = [
    DRONE_IMAGES.MULTIROTOR,
    DRONE_IMAGES.OCTACOPTER,
    DRONE_IMAGES.VTOL,
    DRONE_IMAGES.SWARM,
    DRONE_IMAGES.HALE,
    DRONE_IMAGES.AI, 
  ];
  
  const products = [
    {
      title: 'Aerial Vechicle',
      description: 'Mission-specific drone platforms engineered for your exact requirements with indigenous technology.',
      image: DRONE_IMAGES.MULTIROTOR,
    },
    {
      title: 'Defence Drone Systems',
      description: 'Advanced drone solutions for defence and security applications with proven reliability.',
      image: DRONE_IMAGES.OCTACOPTER,
    },
    {
      title: 'AI & Drone Intelligence',
      description: 'Intelligence platform for drone operations with real-time detection and analysis capabilities.',
      image: 'https://images.unsplash.com/photo-1609619385076-36a873425636?w=800',
    },
    {
      title: 'Aerolabs & Centers of Excellence',
      description: 'Educational platform for drone enthusiasts to learn fundamentals and hands-on development.',
      image: 'https://images.unsplash.com/photo-1767042286080-446afa2c78d8?w=800',
    },
  ];

  const capabilities = [
    {
      icon: <Target size={32} />,
      title: 'Mission-Specific Design',
      description: 'Tailored solutions for specific operational requirements and environments',
    },
    {
      icon: <Package size={32} />,
      title: 'Modular Platforms',
      description: 'Scalable architecture allowing rapid adaptation and deployment',
    },
    {
      icon: <Radio size={32} />,
      title: 'Real-Time Detection',
      description: 'Advanced sensor fusion and AI-powered threat detection systems',
    },
    {
      icon: <Shield size={32} />,
      title: 'Defence-Grade Reliability',
      description: 'Proven systems built to perform in demanding operational conditions',
    },
    {
      icon: <Cpu size={32} />,
      title: 'Indigenous Technology',
      description: 'Developed and manufactured in India with complete technology sovereignty',
    },
    {
      icon: <Zap size={32} />,
      title: 'R&D Excellence',
      description: 'Continuous innovation backed by strong research and development',
    },
  ];

  return (
    <div className="min-h-screen">
      <VideoHero
        videoSrc="/media/combat-drone-hero.mp4"
        fallbackImages={heroImages}
        title="Engineering the Future of Aerial Intelligence"
        subtitle="Advanced drone systems and AI platforms for defence and innovation"
      >
        <PrimaryButton onClick={() => navigate('/contact')}>Request Consultation</PrimaryButton>
        <SecondaryButton onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}>
          Explore Solutions
        </SecondaryButton>
      </VideoHero>

      {/* Who We Are */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-6"
          >
            Who We Are
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed"
          >
            <a className="text-[#281ca6] font-bold">Rigvaimaniki Technologies</a> is an indigenous drone technology company specializing in 
            defence-grade systems and AI platforms. We combine engineering excellence with innovation 
            to deliver mission-critical solutions.
          </motion.p>
        </div>
      </section>

      {/* What We Provide */}
      <section id="solutions" className="py-24 px-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-16 text-center"
          >
            What We Provide
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Capabilities */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-16 text-center"
          >
            Our Capabilities
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <CapabilityCard {...capability} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Passion Bridge */}
      <section className="py-24 px-6 bg-[radial-gradient(circle_at_50%_50%,#000000,#3533cd)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-6"
          >
            Driven by Passion
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-12 text-white/90"
          >
            Innovation, engineering excellence, and responsible technology development drive everything we do.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link to="/passion">
              <SecondaryButton className="border-white text-white">Our Passion</SecondaryButton>
            </Link>
            <Link to="/careers">
              <SecondaryButton className="border-white text-white">Join Us</SecondaryButton>
            </Link>
            <Link to="/param">
              <SecondaryButton className="border-white text-white">Visit Param</SecondaryButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl mb-6"
          >
            Have a Requirement or an Idea?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 mb-12"
          >
            Let's discuss how we can help you achieve your goals
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <PrimaryButton onClick={() => navigate('/contact')}>Request Consultation</PrimaryButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
