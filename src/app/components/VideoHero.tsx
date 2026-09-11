import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoHeroProps {
  videoSrc?: string;
  fallbackImages: string[];
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function VideoHero({ videoSrc, fallbackImages, title, subtitle, children }: VideoHeroProps) {
  const [useVideo, setUseVideo] = useState(!!videoSrc);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!useVideo && fallbackImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % fallbackImages.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [useVideo, fallbackImages]);

  const handleVideoError = () => {
    setUseVideo(false);
  };

  return (
    <div className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Background Media */}
      {useVideo && videoSrc ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={handleVideoError}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={fallbackImages[currentImageIndex]}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl mb-6 tracking-tight"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
