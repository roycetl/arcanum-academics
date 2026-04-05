"use client";

import React from "react";
import { motion } from "framer-motion";
import DiamondStaff from "./DiamondStaff";
import { Flame, Swords, BarChart3, BookOpen, ScanEye, Upload } from "lucide-react";

interface LandingPageProps {
  currentView: 'forge' | 'analytics';
  setCurrentView: (view: 'forge' | 'analytics') => void;
  forgeMode: 'SELECT' | 'RITUAL';
  setForgeMode: (mode: 'SELECT' | 'RITUAL') => void;
  ritualConfig: any;
  setRitualConfig: (config: any) => void;
  handleUpload: (e: any) => void;
  uploading: boolean;
  cooldownSeconds: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  PRESETS: any[];
  LANGUAGES: string[];
  AnalyticsView: React.ReactNode;
}

const LandingPageComponent: React.FC<LandingPageProps> = ({
  currentView,
  setCurrentView,
  forgeMode,
  setForgeMode,
  ritualConfig,
  setRitualConfig,
  handleUpload,
  uploading,
  cooldownSeconds,
  fileInputRef,
  PRESETS,
  LANGUAGES,
  AnalyticsView
}) => {
  return (
    <div className="flex flex-col w-full bg-[#0a0e21]">
      {/* Hero Section (Title Page with Diamond and Staff) */}
      <section className="w-full">
         <DiamondStaff />
      </section>

      {/* Navigation for Forge vs Analytics */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-4 z-[100] bg-zinc-950/60 p-2.5 rounded-full border border-emerald-950/40 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <button 
           onClick={() => setCurrentView('forge')} 
           className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold tracking-widest uppercase text-sm transition-all duration-500 ${currentView === 'forge' ? 'bg-emerald-900/50 text-[#98ff98] border border-emerald-500/30' : 'text-emerald-700 hover:text-emerald-300'}`}
        >
          <Swords size={18} /> The Forge
        </button>
        <button 
           onClick={() => setCurrentView('analytics')} 
           className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold tracking-widest uppercase text-sm transition-all duration-500 ${currentView === 'analytics' ? 'bg-emerald-900/50 text-[#98ff98] border border-emerald-500/30' : 'text-emerald-700 hover:text-emerald-300'}`}
        >
          <BarChart3 size={18} /> Hall of Records
        </button>
      </nav>

      {/* Main Content Area (Forge or Analytics) */}
      <section id="studify-setup-anchor" className="w-full min-h-screen relative flex flex-col items-center py-20 pb-32 bg-black">
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />
         
         {currentView === 'analytics' ? (
           <div className="z-10 relative flex flex-col items-center w-full max-w-5xl gap-12 pt-16">
              {AnalyticsView}
           </div>
         ) : (
           <div className="z-10 relative flex flex-col items-center w-full max-w-5xl gap-12 pt-16">
              <div className="text-center space-y-4">
                <h1 className="text-6xl md:text-7xl font-bold tracking-widest uppercase text-white flex items-center justify-center gap-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                   <Flame className="text-emerald-500 w-14 h-14 animate-pulse" /> THE FORGE <Flame className="text-emerald-500 w-14 h-14 animate-pulse" />
                </h1>
              </div>

              {forgeMode === 'SELECT' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-10 w-full max-w-2xl pt-10"
                >
                  <div className="flex flex-col w-full gap-8">
                    <button onClick={() => setForgeMode('RITUAL')} className="group relative flex items-center justify-start gap-8 px-12 py-10 bg-[#050f0a]/60 backdrop-blur-2xl rounded-[2.5rem] border-2 border-emerald-900/30 hover:border-emerald-500 transition-all duration-500 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)] w-full">
                       <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/20 group-hover:bg-emerald-400 group-hover:text-black transition-all">
                          <Flame className="w-10 h-10 text-emerald-400 group-hover:text-black" />
                       </div>
                       <div className="flex flex-col items-start text-left">
                          <span className="text-emerald-100 font-bold uppercase tracking-[0.2em] text-3xl group-hover:text-white transition-colors">The Sacrifice</span>
                          <span className="text-emerald-600 font-normal italic text-lg tracking-wide">Enter the Deckbuilder Battle</span>
                       </div>
                    </button>
                    <button onClick={() => window.location.href='/api/gamify'} className="group relative flex items-center justify-start gap-8 px-12 py-10 bg-[#030510]/60 backdrop-blur-2xl rounded-[2.5rem] border-2 border-indigo-900/30 hover:border-indigo-500 transition-all duration-500 shadow-[0_0_40px_-10px_rgba(79,70,229,0.2)] hover:shadow-[0_0_60px_-10px_rgba(79,70,229,0.5)] w-full">
                       <div className="flex items-center justify-center w-20 h-20 rounded-full bg-indigo-950/40 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <BookOpen className="w-10 h-10 text-indigo-400 group-hover:text-white" />
                       </div>
                       <div className="flex flex-col items-start text-left">
                          <span className="text-indigo-100 font-bold uppercase tracking-[0.2em] text-3xl group-hover:text-white transition-colors">Trial of the Tome</span>
                          <span className="text-indigo-600 font-normal italic text-lg tracking-wide">Upload &amp; Conquer Your Exam</span>
                       </div>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-10 w-full max-w-xl z-30">
                  <div className="bg-[#050f0a]/40 p-10 rounded-[3rem] border border-emerald-500/20 w-full flex flex-col gap-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] backdrop-blur-3xl">
                    <div className="text-white font-bold tracking-[0.3em] text-xl uppercase text-center flex items-center justify-center gap-4">
                      <ScanEye className="text-emerald-400" /> RITUAL CONFIGURATION
                    </div>

                    <div className="flex flex-col gap-5">
                      <label className="text-xs font-normal italic text-emerald-400 tracking-[0.4em] uppercase opacity-60">Language Selection</label>
                      <select 
                        value={ritualConfig.targetLanguage} 
                        onChange={(e) => setRitualConfig((p:any) => ({...p, targetLanguage: e.target.value}))}
                        className="w-full bg-black/60 border border-emerald-900/50 rounded-2xl py-5 px-6 text-[#98ff98] font-normal hover:border-emerald-500 transition-all focus:outline-none"
                      >
                        {LANGUAGES.map(lang => (<option key={lang} value={lang} className="bg-black">{lang}</option>))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-5">
                      <label className="text-xs font-normal italic text-emerald-400 tracking-[0.4em] uppercase opacity-60">Spell Quantities</label>
                      <div className="relative">
                        <input 
                          type="number" min="1" value={ritualConfig.quantity} 
                          onChange={(e) => setRitualConfig((p:any) => ({...p, quantity: parseInt(e.target.value) || 1}))} 
                          className="w-full bg-black/60 border border-emerald-900/50 rounded-2xl py-5 px-6 text-[#98ff98] font-normal hover:border-emerald-500 transition-all"
                        />
                         <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-800 font-normal lowercase italic">[ Spells ]</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-end">
                        <label className="text-xs font-normal italic text-emerald-400 tracking-[0.4em] uppercase opacity-60">Arcane Threshold</label>
                        <span className="text-emerald-400 font-normal italic text-sm">{ritualConfig.threshold}% Accuracy</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {PRESETS.map((p) => (
                          <button key={p.id} onClick={() => setRitualConfig((prev:any) => ({...prev, difficulty: p.id, threshold: p.value || prev.threshold}))} className={`py-4 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${ritualConfig.difficulty === p.id ? 'bg-emerald-900/40 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-black/40 border-emerald-950 text-emerald-900 hover:border-emerald-700'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6 w-full">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || cooldownSeconds > 0}
                        className="w-full group py-8 rounded-full bg-gradient-to-b from-emerald-800 to-emerald-950 border-2 border-emerald-400 text-emerald-50 font-morris uppercase tracking-[0.4em] text-xl hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all shadow-2xl relative overflow-hidden disabled:opacity-50"
                     >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {uploading ? "FORGING..." : cooldownSeconds > 0 ? `RECHARGING: ${cooldownSeconds}s` : "IGNITE THE FIRE"}
                     </button>
                     <button onClick={() => setForgeMode('SELECT')} className="text-emerald-900 hover:text-emerald-500 font-serif uppercase tracking-widest text-xs transition-colors">[ Return to Library ]</button>
                  </div>
                  <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleUpload}/>
                </motion.div>
              )}
           </div>
         )}
      </section>
    </div>
  );
};

export default LandingPageComponent;
