import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, PhoneCall, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/rigvaimaniki-logo.png";

interface FooterProps {
  addressLine1?: string;
  addressLine2?: string;
}

export function Footer({ 
  addressLine1 = "iStart Nest Incubation Center Gov. Polytechnic College ,", 
  addressLine2 = "Jodhpur" 
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: "Home", path: "/" },
    { name: "Defence", path: "/defence" },
    { name: "Param", path: "/param" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden bg-[#f5f5f5]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#f5f5f5]" />

      <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold tracking-wide mb-4 text-slate-900">
              Quick Links
            </h3>

            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold tracking-wide mb-4 text-slate-900">
              Contact
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="block">{addressLine1}</span>
              <span className="block">{addressLine2}</span>
            </p>

            <div className="flex justify-center md:justify-start items-center gap-2 mt-4">
              <a
                href="mailto:rigvaimanikitechnologies@gmail.com"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Email us"
                title="Email us"
              >
                <Mail size={16} />
              </a>
              <a
                href="tel:+916367803161"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Call us"
                title="Call us"
              >
                <PhoneCall size={16} />
              </a>
              <a
                href="https://www.instagram.com/rigvaimaniki?utm_source=qr&igsh=b2FhODF2ZWp2ejN2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.linkedin.com/in/rigvaimaniki-technologies-5139423b9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-900 transition-colors"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              rigvaimanikitechnologies@gmail.com
            </p>
          </div>

          <div className="flex flex-col justify-center md:items-end items-center text-center md:text-right py-6 md:py-0">
            <Link
              to="/"
              className="mb-4 inline-flex h-[87px] items-center md:translate-x-2"
            >
              <img
                src={logo}
                alt="Rigvaimaniki Technologies"
                draggable={false}
                className="h-[87px] w-[220px] object-cover object-[50%_45%] select-none pointer-events-none"
                style={{ height: 87, maxHeight: 87 }}
              />
            </Link>

            <p className="text-sm font-medium text-slate-700">
              &copy;2019-{currentYear} Rigvaimaniki Technologies
            </p>
            <p className="text-xs text-slate-500 mt-1">Built for the future</p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
