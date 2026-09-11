import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type ButtonProps = HTMLMotionProps<"button"> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-8 py-3.5 bg-[radial-gradient(circle_at_50%_50%,#111111,#3533cd)] hover:bg-blue-700 text-white rounded-lg transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-8 py-3.5 bg-transparent border-2 border-current hover:bg-white/10 rounded-lg transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
