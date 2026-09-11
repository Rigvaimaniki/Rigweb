import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Instagram, Linkedin } from 'lucide-react';
import logo from '@/assets/rigvaimaniki-logo.png';
import { Link } from 'react-router-dom';
import { PARAM_CENTERS } from '@/app/constants/paramData';

export function Contact() {
  const selectedCenter = PARAM_CENTERS[0];
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Defence', path: '/defence' },
    { name: 'Aerolab', path: '/aerolab' },
    { name: 'AI', path: '/ai' },
    { name: 'Careers', path: '/careers' },
  ];

  return (
    <div className="min-h-screen pt-24">
      {/* Hero */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-cyan-50 to-white dark:from-neutral-950 dark:to-black">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl mb-6"
        >
          Contact Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-neutral-600 dark:text-neutral-400"
        >
          Get in Touch
        </motion.p>
      </section>

      {/* Contact Info */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <img src={logo} alt="Rigvaimaniki Technologies" className="h-50 mx-auto mb-0" />
            <h2 className="text-3xl mb-1 text-[#281ca6]">Rigvaimaniki Technologies</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex justify-center mb-4">
                <a
                  href={selectedCenter.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors p-2"
                  aria-label="Open selected center in Google Maps"
                >
                  <MapPin size={34} />
                </a>
              </div>
              <h3 className="mb-2">Location</h3>
              <p className="text-neutral-600 dark:text-neutral-400">{selectedCenter.address}</p>
              <p className="text-neutral-600 dark:text-neutral-400"> India</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex justify-center mb-4">
                <a
                  href="mailto:rigvaimanikitechnologies@gmail.com"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors p-2"
                  aria-label="Send email"
                >
                  <Mail size={34} />
                </a>
              </div>
              <h3 className="mb-2">Email</h3>
              <a
                href="mailto:rigvaimanikitechnologies@gmail.com"
                className="inline-block max-w-full break-all text-sm text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-600 transition-colors"
              >
                contact@rigvaimaniki
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex justify-center mb-4">
                <a
                  href="tel:+916367803161"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors p-2"
                  aria-label="Call phone number"
                >
                  <Phone size={34} />
                </a>
              </div>
              <h3 className="mb-2">Phone</h3>
              <a
                href="tel:+916367803161"
                className="text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-600 transition-colors"
              >
                +91 6367803161
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex justify-center mb-4">
                <a
                  href="https://www.instagram.com/rigvaimaniki?utm_source=qr&igsh=b2FhODF2ZWp2ejN2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors p-2"
                  aria-label="Open Instagram profile"
                >
                  <Instagram size={34} />
                </a>
              </div>
              <h3 className="mb-2">Instagram</h3>
              <a
                href="https://www.instagram.com/rigvaimaniki?utm_source=qr&igsh=b2FhODF2ZWp2ejN2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-600 transition-colors"
              >
                @rigvaimaniki
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex justify-center mb-4">
                <a
                  href="https://www.linkedin.com/in/rigvaimaniki-technologies-5139423b9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 transition-colors p-2"
                  aria-label="Open LinkedIn profile"
                >
                  <Linkedin size={34} />
                </a>
              </div>
              <h3 className="mb-2">LinkedIn</h3>
              <a
                href="https://www.linkedin.com/in/rigvaimaniki-technologies-5139423b9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-600 transition-colors"
              >
                Rigvaimaniki Technologies
              </a>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl mb-6">Quick Links</h3>
            <nav className="flex flex-wrap justify-center gap-3">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="rounded-full border border-cyan-200 bg-cyan-50/70 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100 hover:border-cyan-300 hover:-translate-y-0.5 transition-all"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

