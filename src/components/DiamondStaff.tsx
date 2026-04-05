"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function DiamondStaff() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate magical dust particles only on client-side to prevent hydration mismatch
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage string
      y: Math.random() * 100, // percentage string
      size: Math.random() * 4 + 1, // 1px to 5px
      duration: Math.random() * 5 + 5, // 5s to 10s float
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  const scrollToSetup = () => {
    const setupElement = document.getElementById("studify-setup-anchor");
    if (setupElement) {
      setupElement.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full h-[100vh] flex flex-col justify-center items-center overflow-hidden bg-transparent text-white selection:bg-emerald-900 selection:text-white">
      
      {/* Dynamic Magical Atmosphere - Floating Boho Dust */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: `${p.y + 10}vh`, x: `${p.x}vw`, scale: 0 }}
            animate={{ 
              opacity: [0, Math.random() * 0.5 + 0.3, 0], 
              y: `${p.y - Math.random() * 20}vh`,
              x: `${p.x + (Math.random() * 4 - 2)}vw`,
              scale: [0, 1, 0.5]
            }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute rounded-full blur-[1px] ${
              p.id % 3 === 0 ? 'bg-emerald-300' : p.id % 2 === 0 ? 'bg-[#ffcba4]' : 'bg-[#ff7f50]'
            }`}
            style={{ width: p.size, height: p.size, filter: `drop-shadow(0 0 ${p.size * 2}px rgba(255,255,255,0.8))` }}
          />
        ))}
      </div>

      {/* Radiant Light Rays emanating from background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <motion.div 
            animate={{ rotate: 360, opacity: [0.3, 0.6, 0.3] }} 
            transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            className="w-[800px] h-[800px] absolute"
         >
            {/* Spinning Light Rays constructed via conic-gradient overlays */}
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(16, 185, 129, 0.1) 20deg, transparent 40deg, rgba(255, 203, 164, 0.05) 60deg, transparent 80deg, rgba(16, 185, 129, 0.1) 120deg, transparent 150deg, rgba(152, 255, 152, 0.1) 180deg, transparent 200deg, rgba(255, 127, 80, 0.05) 240deg, transparent 270deg, rgba(16, 185, 129, 0.1) 300deg, transparent 360deg)', filter: 'blur(30px)' }} />
         </motion.div>
      </div>

      {/* Hero Assembly Container (The Floating Staff & Text) */}
      <motion.div 
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: [0, -15, 0], opacity: 1 }}
        transition={{ 
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.5, ease: "easeOut" }
        }}
        className="relative flex flex-col items-center justify-center w-full z-10 h-full"
      >
          {/* Colossal Broader Diamond SVG Layer */}
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 scale-[1.5] sm:scale-[2] md:scale-[2.5] lg:scale-[3] transform-gpu pointer-events-none flex justify-center items-center">
             
             {/* Extreme Luminance Back-Glow */}
             <motion.div 
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[250px] h-[150px] bg-emerald-400/50 rounded-full blur-[80px] -translate-y-8" 
             />

             <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
                <defs>
                   <filter id="hyperGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="15" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                   </filter>
                   <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                   </filter>
                </defs>

                {/* Archaic Winding Wooden Staff (The Grandmaster's Thick Branch) */}
                <path d="M150 400 C 140 330, 170 280, 155 220 C 140 160, 170 120, 160 60 L 240 60 C 230 120, 260 160, 245 220 C 230 280, 260 330, 250 400 Z" fill="#1c0f0a" />
                <path d="M165 400 C 160 330, 190 280, 175 220 C 160 160, 185 120, 175 60 L 205 60 C 215 120, 190 160, 205 220 C 220 280, 190 330, 205 400 Z" fill="#2d1a11" />
                <path d="M190 400 C 195 340, 225 290, 210 230 C 195 170, 225 130, 215 60 L 235 60 C 245 130, 215 170, 230 230 C 245 290, 215 340, 235 400 Z" fill="#3a2215" />
                
                {/* Ancient Bark Textures and Deep Shadows */}
                <path d="M175 400 C 170 330, 210 270, 185 220 C 160 170, 205 120, 195 60" stroke="#0f0703" strokeWidth="5" fill="none" opacity="0.8" />
                <path d="M210 400 C 220 320, 180 260, 225 200 C 260 140, 200 100, 215 60" stroke="#0a0502" strokeWidth="7" fill="none" opacity="0.9" />
                <path d="M190 350 C 205 320, 185 280, 200 240" stroke="#000000" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
                
                {/* The Crystal Pedestal Base Structure (Cradling the Gem) */}
                <path d="M150 90 C 130 70, 110 50, 100 75 C 115 95, 135 105, 160 110 Z" fill="#2d1a11" />
                <path d="M250 90 C 270 70, 290 50, 300 75 C 285 95, 265 105, 240 110 Z" fill="#1c0f0a" />
                <path d="M160 60 L 140 40 L 260 40 L 240 60 Z" fill="#3a2215" />
                <path d="M140 40 L 150 20 L 250 20 L 260 40 Z" fill="#4f2f1d" />

                {/* THE REDESIGNED BROADER FLAT-TOP DIAMOND */}
                <g filter="url(#hyperGlow)" className="opacity-95">
                  {/* Central Extremely Bright Core (Sage Green & Boho Palette Pulse) */}
                  <path d="M120 20 L280 20 L350 90 L200 230 L50 90 Z" className="animate-boho opacity-100" />
                  
                  {/* Flat Top Surface Facet */}
                  <path d="M120 20 L280 20 L250 60 L150 60 Z" fill="#ffffff" opacity="0.6" />
                  <path d="M130 25 L270 25 L240 55 L160 55 Z" fill="#d1fae5" opacity="0.8" />
                  
                  {/* Side Angled Facets - Generating Width and Depth */}
                  <path d="M50 90 L120 20 L150 60 L100 90 Z" fill="#a7f3d0" opacity="0.9" />
                  <path d="M350 90 L280 20 L250 60 L300 90 Z" fill="#6ee7b7" opacity="0.8" />
                  <path d="M50 90 L100 90 L200 230 Z" fill="#34d399" opacity="0.8" />
                  <path d="M350 90 L300 90 L200 230 Z" className="animate-boho opacity-70" style={{ animationDelay: '2s' }} />

                  {/* Central Lower Broad Facet for maximum background brightness */}
                  <path d="M100 90 L300 90 L200 230 Z" fill="#10b981" opacity="0.6" />
                  <path d="M150 60 L250 60 L300 90 L100 90 Z" fill="#ffffff" opacity="0.9" filter="url(#subtleGlow)" />
                </g>

                {/* Giant Runic Symbol floating faintly inside the diamond for realism */}
                <path d="M185 100 L215 100 L200 130 Z M200 110 L200 160 M190 140 L210 140" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" className="opacity-20 blend-overlay" />
                <path d="M160 70 L240 70 L250 80 L150 80 Z" fill="#ffffff" className="opacity-30 mix-blend-overlay" />
             </svg>
          </div>

          {/* Core Title Overlay - Rendered purely in Black for extreme contrast against the hyper-lucid Diamond */}
          <div className="z-[100] flex flex-col items-center justify-center absolute top-[30%] -translate-y-[50%] mt-8">
             <h1 className="text-black font-bold tracking-widest uppercase text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-center leading-none" style={{ textShadow: "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(16,185,129,0.3)" }}>
                STUDIFY
             </h1>
          </div>
      </motion.div>

      {/* Interaction Console - Tagline and Pushed Lower */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-[20vh] flex flex-col items-center gap-6 z-20 pointer-events-auto"
      >
         <h2 className="text-white text-lg sm:text-2xl font-normal italic tracking-wide font-light text-center drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]">
           Forge your knowledge. Level up your studying.
         </h2>
         
         <button 
           onClick={scrollToSetup}
           className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform duration-300"
         >
            <div className="px-12 py-5 border border-white/20 bg-black/40 hover:bg-emerald-950/40 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] hover:border-emerald-500/50 transition-all border-b-white/50">
               <span className="text-white font-normal font-black tracking-[0.25em] uppercase text-2xl flex items-center gap-3">
                 PLAY <ArrowDown className="w-5 h-5 group-hover:translate-y-2 group-hover:text-emerald-300 transition-all duration-300" />
               </span>
            </div>
         </button>

         <p className="text-white/50 font-normal text-sm tracking-widest mt-1 uppercase drop-shadow-md">
           Begin the Ritual <span className="lowercase italic opacity-80">(Scroll to setup)</span>
         </p>
      </motion.div>

    </div>
  );
}
