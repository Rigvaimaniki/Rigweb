import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ProductCardProps {
  title: string;
  description: string;
  image?: string;
  children?: ReactNode;
}
export function ProductCard({ title, description, image, children }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="
        h-full flex flex-col
        bg-white/20 dark:bg-neutral-900/40
        backdrop-blur-md
        rounded-2xl overflow-hidden
        shadow-lg hover:shadow-2xl
        transition-all duration-300
        border border-white/20 dark:border-neutral-800/40
      "
    >
      {image && (
        <div className="w-full aspect-[1360/768] overflow-hidden bg-white/10 dark:bg-neutral-800/30">
          <img src={image} alt={title} className="w-full h-full object-cover object-center" />
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        <h3 className="text-xl mb-3 text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>

        <p className="mb-6 leading-relaxed text-neutral-800 dark:text-neutral-300">
          {description}
        </p>

        {children && <div className="mt-auto">{children}</div>}
      </div>
    </motion.div>
  );
}


interface CapabilityCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}
export function CapabilityCard({ title, description, icon }: CapabilityCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="
        p-6
        bg-white/20 dark:bg-neutral-900/40
        backdrop-blur-md
        rounded-xl
        border border-white/20 dark:border-neutral-800/40
        hover:border-blue-500/60
        transition-all duration-200
      "
    >
      {icon && <div className="mb-4 text-blue-600">{icon}</div>}

      <h4 className="mb-2 text-neutral-900 dark:text-neutral-100">
        {title}
      </h4>

      <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-300">
        {description}
      </p>
    </motion.div>
  );

}
