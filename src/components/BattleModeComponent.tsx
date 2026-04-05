"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import React from "react";

interface BattleModeProps {
  boss: any;
  wizardHP: number;
  goblinHP: number;
  maxGoblinHP: number;
  enemyStatuses: { type: 'BURN' | 'ICE' | 'DARK', duration: number }[];
  playerStatuses: { type: 'GRASS', duration: number }[];
  battlePhase: 'QUESTIONING' | 'BATTLING' | 'FAILED' | 'VICTORY';
  currentSpellIndex: number;
  lastAction: 'CORRECT' | 'INCORRECT' | null;
  onAttack: (spell: any, opt: string) => void;
  onCastSpell: (index: number) => void;
  onRetry: () => void;
  onReturnToMenu: () => void;
  onRetreat: () => void;
  isShaking: boolean;
  isLightning: boolean;
  theme: any;
  ritualConfigQuantity: number;
}

const BattleModeComponent: React.FC<BattleModeProps> = ({
  boss,
  wizardHP,
  goblinHP,
  maxGoblinHP,
  enemyStatuses,
  playerStatuses,
  battlePhase,
  currentSpellIndex,
  lastAction,
  onAttack,
  onCastSpell,
  onRetry,
  onReturnToMenu,
  onRetreat,
  isShaking,
  isLightning,
  theme,
  ritualConfigQuantity
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      className={`w-full h-full flex flex-col bg-black relative overflow-hidden`}
    >
      {/* 
          Battle HUD Implementation 
          Combat-Ready High-Contrast Health Bars (Sage Green & Peach/Orange)
      */}
      <div className="absolute top-8 left-8 flex flex-col gap-6 z-50 w-72 pointer-events-none">
         
         {/* Wizard HP (Sage Green #a9bca1) */}
         <div className="flex flex-col gap-1.5 drop-shadow-[0_0_15px_rgba(169,188,161,0.4)]">
            <div className="flex justify-between items-end">
               <div className="flex flex-col">
                  <span className="text-[#a9bca1] font-bold tracking-widest text-xl uppercase">WIZARD</span>
                  {/* Player Status Icons */}
                  <div className="flex gap-2 min-h-[16px]">
                     {playerStatuses.map((s, i) => (
                        <motion.span key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[#a9bca1] text-[10px] font-bold tracking-wider uppercase font-serif">
                           {s.type === 'GRASS' ? '🌿 GROWTH' : ''}
                        </motion.span>
                     ))}
                  </div>
               </div>
               <span className="text-[#a9bca1] font-serif text-xs opacity-80">{Math.ceil(wizardHP)} / 100</span>
            </div>
            <div className="w-full h-4 bg-zinc-950 border border-[#a9bca1]/40 rounded-full overflow-hidden shadow-inner relative group">
               <motion.div 
                  animate={{ width: `${wizardHP}%` }} 
                  transition={{ type: "spring", damping: 12, stiffness: 60 }} 
                  className="h-full bg-[#a9bca1] relative"
               >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-sm" />
               </motion.div>
            </div>
         </div>

          {/* Enemy HP (Peach/Orange #e5a484) */}
          <div className="flex flex-col gap-1.5 drop-shadow-[0_0_15px_rgba(229,164,132,0.4)]">
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[#e5a484] font-bold tracking-widest text-xl uppercase">THE ABOMINATION</span>
                   {/* Enemy Status Icons */}
                   <div className="flex gap-2 min-h-[16px]">
                      {enemyStatuses.map((s, i) => (
                         <motion.span key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[#e5a484] text-[10px] font-bold tracking-wider uppercase font-serif">
                            {s.type === 'BURN' ? `🔥 BURN ${s.duration}r` : s.type === 'ICE' ? '❄️ SHARDED' : s.type === 'DARK' ? '🌑 DARK' : ''}
                         </motion.span>
                      ))}
                   </div>
                </div>
                <span className="text-[#e5a484] font-serif text-xs opacity-80">{Math.ceil(goblinHP)} / {maxGoblinHP}</span>
             </div>
            <div className="w-full h-4 bg-zinc-950 border border-[#e5a484]/40 rounded-full overflow-hidden shadow-inner relative group">
               <motion.div 
                  animate={{ width: `${(goblinHP / maxGoblinHP) * 100}%` }} 
                  transition={{ type: "spring", damping: 12, stiffness: 60 }} 
                  className="h-full bg-[#e5a484] relative"
               >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-sm" />
               </motion.div>
            </div>
         </div>
      </div>

      {/* Quit Button removed - now handled by parent DashboardClient for guaranteed visibility */}

      {/* Lightning Effect */}
      <AnimatePresence>
        {isLightning && (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100]" viewBox="0 0 100 100" preserveAspectRatio="none">
             <motion.path d="M 12 80 L 25 55 L 18 50 L 50 15" fill="transparent" stroke={theme.boltHard} strokeWidth="1.5" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 1, filter: `drop-shadow(0 0 10px ${theme.boltHard})` }} animate={{ pathLength: 1, opacity: 0, filter: `drop-shadow(0 0 30px ${theme.boltHard})` }} transition={{ duration: 0.6, ease: "easeOut" }} />
             <motion.path d="M 12 80 L 30 65 L 25 45 L 50 15" fill="transparent" stroke={theme.boltSoft} strokeWidth="0.8" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }} />
          </svg>
        )}
      </AnimatePresence>

      {/* Arena Base */}
      <div className="absolute inset-0 bg-zinc-950 z-0 pointer-events-none" />

      {/* Enemy Goblin */}
      <motion.div 
        className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10 drop-shadow-[0_0_40px_rgba(229,164,132,0.2)]"
        animate={
           battlePhase === 'BATTLING' && lastAction === 'INCORRECT' 
             ? { y: [0, -40, 0, -20, 0], rotate: [0, -10, 10, -5, 0] } 
             : battlePhase === 'BATTLING' && lastAction === 'CORRECT'
             ? { scale: [1, 1.2, 0.8, 1], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] }
             : { y: [0, -10, 0] }
        }
        transition={
           battlePhase === 'BATTLING' ? { duration: 0.8 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
         <svg width="250" height="250" viewBox="0 0 100 100" fill="#e8a5b8">
            <path d="M50 20 C30 20 20 40 20 60 C20 80 40 90 50 90 C60 90 80 80 80 60 C80 40 70 20 50 20 Z" />
            <circle cx="35" cy="50" r="8" fill="#111" />
            <circle cx="65" cy="50" r="8" fill="#111" />
            <path d="M40 70 Q50 80 60 70" stroke="#111" strokeWidth="3" fill="none" />
            <path d="M25 40 L5 20 L28 35 Z" />
            <path d="M75 40 L95 20 L72 35 Z" />
         </svg>
      </motion.div>

      {/* Wizard Hands POV */}
      <div className="absolute bottom-0 left-12 z-10 drop-shadow-[0_0_50px_rgba(169,188,161,0.2)]">
         <motion.svg width="350" height="400" viewBox="0 0 100 100" animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <path d="M10 90 L90 90 L80 50 L20 50 Z" fill="#2d1a11" />
            <path d="M20 50 L45 40 L50 90 L20 90 Z" fill="#fcd34d" />
            <path d="M80 50 L55 40 L50 90 L80 90 Z" fill="#fef3c7" />
            {/* Runes on robes */}
            <path d="M25 55 L40 55 M25 65 L40 65 M60 55 L75 55 M60 65 L75 65" stroke="#111" strokeWidth="2" opacity="0.4"/>
         </motion.svg>
      </div>
      
      {/* Gnarled Staff POV */}
      <div className="absolute bottom-[-80px] right-12 z-10 origin-bottom">
         <motion.svg 
            width="300" height="800" viewBox="0 0 400 400" 
            animate={ battlePhase === 'BATTLING' && lastAction === 'CORRECT' ? { rotate: [0, -25, 0], y: [0, -100, 0] } : { y: [0, 20, 0] } } 
            transition={ battlePhase === 'BATTLING' ? { duration: 0.5 } : { duration: 4, repeat: Infinity, ease: "easeInOut" } }
         >
            <path d="M180 400 Q190 200 200 100" stroke="#1c0f0a" strokeWidth="60" fill="none" strokeLinecap="round" />
            <path d="M180 400 Q190 200 200 100" stroke="#2d1a11" strokeWidth="40" fill="none" strokeLinecap="round" />
            <path d="M200 100 L120 20 L280 20 Z" fill="#10b981" opacity="0.9" filter="drop-shadow(0 0 30px #34d399)" />
            <polygon points="200,0 150,20 250,20" fill="#a7f3d0" />
         </motion.svg>
      </div>

      {/* Question Card Interface */}
      <AnimatePresence>
        {battlePhase === 'QUESTIONING' && boss.spells && boss.spells[currentSpellIndex] && (
          <motion.div 
            key={`card-${currentSpellIndex}`}
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0, y: 100 }} 
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center z-50 p-8 pointer-events-none"
          >
            <div className="w-full max-w-xl px-8 py-8 bg-[#030a06]/95 backdrop-blur-xl rounded-2xl border border-emerald-500 shadow-[0_0_60px_-10px_rgba(16,185,129,0.4)] flex flex-col gap-5 pointer-events-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" />
              <h3 className="text-emerald-400 font-serif italic text-center uppercase tracking-widest text-[10px]">
                 Spell Card {currentSpellIndex + 1} / {boss.spells.length}
              </h3>
              <p className="text-white font-serif text-xl leading-relaxed text-center z-10 whitespace-pre-wrap drop-shadow-md">
                 {boss.spells[currentSpellIndex].question}
              </p>
              <div className="grid grid-cols-1 gap-2.5 z-10 w-full">
                {["A", "B", "C", "D"].map((opt) => (
                  <button 
                    key={opt} 
                    onClick={() => onAttack(boss.spells[currentSpellIndex], opt)} 
                    className="w-full text-left px-4 py-3 rounded-xl transition-all duration-300 border backdrop-blur-sm relative overflow-hidden bg-black border-emerald-900/50 hover:border-emerald-400 hover:bg-emerald-900/30 group/btn shadow-inner"
                  >
                    <span className="font-serif italic font-bold mr-3 text-emerald-400 group-hover/btn:text-[#ffcba4] transition-colors text-sm">[{opt}]</span>
                    <span className="text-emerald-100 font-serif text-sm whitespace-pre-wrap">{boss.spells[currentSpellIndex][opt]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Overlays (Failed/Victory) */}
       <AnimatePresence>
         {battlePhase === 'FAILED' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[300] bg-red-950/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-8">
                  <h1 className="text-7xl font-black tracking-[0.4em] text-red-500 uppercase drop-shadow-[0_0_50px_rgba(239,68,68,0.6)] font-serif">QUEST FAILED</h1>
                  <p className="text-red-200 font-normal text-2xl italic tracking-wider max-w-lg font-serif">The arcane feedback was too great. Your soul retreats.</p>
                  <div className="flex flex-col gap-6 mt-10">
                     <button 
                        onClick={onRetry} 
                        className="px-16 py-4 bg-red-500 text-black font-black rounded-full hover:bg-white transition-all uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:scale-110 active:scale-95 text-lg"
                     >
                        RETRY RITUAL
                     </button>
                     <button 
                        onClick={onReturnToMenu} 
                        className="px-16 py-4 bg-black/40 text-red-400 font-bold rounded-full border border-red-500/30 hover:bg-black/60 transition-all uppercase tracking-[0.2em] hover:scale-105 active:scale-95"
                     >
                        QUIT TO TITLE
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
         {battlePhase === 'VICTORY' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[300] bg-[#020503]/98 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-8">
                  <h1 className="text-7xl font-black tracking-[0.4em] text-[#98ff98] uppercase drop-shadow-[0_0_50px_rgba(152,255,152,0.6)] font-serif">SACRIFICE ACCEPTED</h1>
                  <p className="text-[#a7f3d0] font-normal text-2xl italic tracking-wider max-w-lg font-serif">Knowledge has been extracted. The pact is complete.</p>
                  <button 
                     onClick={onReturnToMenu} 
                     className="mt-10 px-20 py-6 bg-[#98ff98] text-black font-black rounded-full hover:bg-white transition-all uppercase tracking-[0.3em] shadow-[0_0_80px_rgba(152,255,152,0.8)] hover:scale-110 active:scale-95 text-lg"
                  >
                     RETURN TO SANCTUM
                  </button>
               </motion.div>
            </motion.div>
         )}
       </AnimatePresence>

    </motion.div>
  );
};

export default BattleModeComponent;
