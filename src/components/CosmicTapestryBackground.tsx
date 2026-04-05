"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Utility to generate random values (client‑only)
const random = (min: number, max: number) => Math.random() * (max - min) + min;

const STRING_COUNT = 25;
const STAR_COLORS = [
  '#FFFFFF', // pure white
  '#FDFD96', // pale gold
];

const CosmicTapestryBackground: React.FC = () => {
  // Positions are generated only on the client after mount to avoid SSR mismatch
  const [strings, setStrings] = useState<Array<{ id: number; left: number; height: number; starSize: number; color: string }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: STRING_COUNT }, (_, i) => ({
      id: i * random(1, 100),
      left: random(5, 95),
      height: random(20, 80), // vh
      starSize: random(2, 4), // px
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
    setStrings(generated);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" style={{ backgroundColor: '#0a0e21' }}>
      
      {/* 
          Synchronized Horizontal Sway 
          Applied to the entire tapestry of strings, stars, and moon.
      */}
      <motion.div
        animate={{ x: [-8, 8, -8] }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-full h-full relative"
      >
        {/* Hanging strings with stars */}
        {strings.map((s) => (
          <React.Fragment key={s.id}>
            {/* 1px wide vertical line extending from top (0) to star height */}
            <div
              className="absolute top-0 w-px bg-white"
              style={{ left: `${s.left}%`, height: `${s.height}vh`, opacity: 0.2 }}
            />
            {/* Star at the end of the string */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: random(0.3, 0.6) }}
              transition={{ duration: 0.8, delay: s.id % 2 }}
              className="absolute rounded-full"
              style={{
                left: `${s.left}%`,
                top: `${s.height}vh`,
                width: `${s.starSize}px`,
                height: `${s.starSize}px`,
                backgroundColor: s.color,
                boxShadow: `0 0 6px ${s.color}`,
                transform: 'translateX(-50%)',
              }}
            />
          </React.Fragment>
        ))}

        {/* Crescent Moon on its own string - Repositioned lower and to the side */}
        <div
          className="absolute top-0 w-px bg-white"
          style={{ left: '15%', height: '35vh', opacity: 0.2 }}
        />
        <motion.div
          animate={{ opacity: 0.4 }}
          className="absolute w-[120px] h-[120px] pointer-events-none"
          style={{
            left: '15%',
            top: '35vh',
            transform: 'translate(-50%, -10%)',
          }}
        >
          {/* Crescent Shape - Outer Shadow Glow */}
          <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
          
          {/* Crescent Core - Using Two Overlapping Circles */}
          <div 
            className="absolute inset-0 rounded-full bg-white/50"
            style={{
              clipPath: 'circle(50% at 50% 50%)',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full bg-[#0a0e21]"
            style={{
              transform: 'translate(15%, -10%)',
              clipPath: 'circle(50% at 50% 50%)',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CosmicTapestryBackground;
