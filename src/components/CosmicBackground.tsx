"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Utility to generate random values (client-only)
const random = (min: number, max: number) => Math.random() * (max - min) + min;

const STAR_COUNT = 150;
const STAR_COLORS = [
  'rgba(255, 255, 255, 0.3)',   // subtle white
  'rgba(255, 215, 0, 0.25)',    // faint gold
  'rgba(152, 251, 152, 0.2)',   // pale sage/mint
];

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export default function CosmicBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate stars only on the client after mount to avoid SSR mismatch
    const generated = Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: random(0, 100),
      y: random(0, 100),
      size: random(1, 4),
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      duration: random(5, 10),
      delay: random(0, 5),
    }));
    setStars(generated);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none w-full h-full overflow-hidden">
      {/* Background clusters with vibration effect */}
      <motion.div 
        animate={{ 
          x: [0, 0.5, -0.5, 0.5, 0],
          y: [0, -0.5, 0.5, -0.5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-full h-full relative"
      >
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0.1 }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{ 
              duration: star.duration, 
              delay: star.delay, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.size > 2 ? `0 0 4px ${star.color}` : 'none',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
