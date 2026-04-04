"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Flame, ShieldAlert, Zap, BookOpen, LogOut, BarChart3, Swords } from "lucide-react";
import { doc, onSnapshot, setDoc, addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

const getTheme = (subject: string) => {
  const sub = (subject || "").toLowerCase();
  if (sub.includes("biolog") || sub.includes("ecolog") || sub.includes("nature")) {
    return { 
      border: "border-emerald-900/50", borderHeavy: "border-emerald-500", glow: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)]", 
      text: "text-emerald-400", bgLight: "bg-emerald-950/20", btnHover: "hover:bg-emerald-900/40 hover:border-emerald-500 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]",
      staffDark: "#064e3b", staffFlash: "#34d399", boltSoft: "#a7f3d0", boltHard: "#34d399", hex: "#34d399"
    };
  }
  if (sub.includes("histor") || sub.includes("literatur") || sub.includes("english")) {
    return { 
      border: "border-amber-900/50", borderHeavy: "border-amber-500", glow: "shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)]", 
      text: "text-amber-400", bgLight: "bg-amber-950/20", btnHover: "hover:bg-amber-900/40 hover:border-amber-500 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)]",
      staffDark: "#78350f", staffFlash: "#fbbf24", boltSoft: "#fde68a", boltHard: "#fbbf24", hex: "#fbbf24"
    };
  }
  // Default Math/Science/Indigo
  return { 
    border: "border-indigo-900/50", borderHeavy: "border-indigo-500", glow: "shadow-[0_0_60px_-15px_rgba(79,70,229,0.2)]", 
    text: "text-indigo-400", bgLight: "bg-indigo-950/20", btnHover: "hover:bg-indigo-900/40 hover:border-indigo-500 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)]",
    staffDark: "#312e81", staffFlash: "#818cf8", boltSoft: "#c7d2fe", boltHard: "#818cf8", hex: "#818cf8"
  };
}

function AnalyticsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "study_logs"), orderBy("timestamp", "desc")));
        const fetched = snapshot.docs.map(d => d.data());
        setLogs(fetched);
      } catch (err) {
        console.error("Failed to load Analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Aggregation
  const subjectStats = logs.reduce((acc, log) => {
    const subj = log.subject || "Unknown";
    if (!acc[subj]) acc[subj] = { subject: subj, totalAccuracy: 0, raids: 0, totalMastery: 0 };
    acc[subj].totalAccuracy += log.accuracy_rate;
    acc[subj].totalMastery += log.mastery_score;
    acc[subj].raids += 1;
    return acc;
  }, {});

  const statsArray: any[] = Object.values(subjectStats).map((s: any) => ({
    ...s,
    avgAccuracy: s.totalAccuracy / s.raids
  })).sort((a, b) => b.totalMastery - a.totalMastery);

  if (loading) return <div className="text-zinc-500 font-mono animate-pulse">Consulting the ancient archives...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-8 p-10 bg-zinc-950/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative"
    >
      <h3 className="text-3xl font-black tracking-widest text-slate-200 uppercase text-center flex items-center justify-center gap-3">
        <BarChart3 className="text-slate-500" />
        Hall of Records
        <BarChart3 className="text-slate-500" />
      </h3>
      
      {statsArray.length === 0 ? (
        <p className="text-center text-zinc-500 font-mono">No raids have been completely archived yet. Return to the Forge.</p>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {statsArray.map((stat, i) => (
            <div key={i} className="flex flex-col gap-2 relative">
              <div className="flex justify-between items-end">
                <span className="text-slate-300 font-bold tracking-widest uppercase">{stat.subject}</span>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-slate-500">Mastery: <span className="text-purple-400">{stat.totalMastery}</span></span>
                  <span className="text-slate-500">Accuracy: <span className="text-emerald-400">{Math.round(stat.avgAccuracy * 100)}%</span></span>
                  <span className="text-slate-500">Raids: {stat.raids}</span>
                </div>
              </div>
              <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.avgAccuracy * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                  className="h-full bg-gradient-to-r from-purple-900 to-purple-500 relative"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/20 blur-sm" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardClient({ initialBossData }: { initialBossData: any }) {
  const [boss, setBoss] = useState(initialBossData || { name: "Unknown Entity", hp: 100, maxHp: 100 });
  const [uploading, setUploading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>(["The Aether waits for your initial sacrifice..."]);
  const [isShaking, setIsShaking] = useState(false);
  const [isLightning, setIsLightning] = useState(false);
  const [showRetreatModal, setShowRetreatModal] = useState(false);
  const [currentView, setCurrentView] = useState<'forge' | 'analytics'>('forge');
  
  // Raid Tracking
  const [raidStats, setRaidStats] = useState({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
  const [isFinalizing, setIsFinalizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bossDoc = doc(db, "gameData", "boss");
    const unsub = onSnapshot(bossDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        
        // Detect transition into battle to reset stats
        if (data.status === "battle_active" && boss.status !== "battle_active") {
            setBattleLog([`The Battle has commenced in the Realm of ${data.subject || "Antiquity"}!`]);
            setRaidStats({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
            setIsFinalizing(false);
        }
        setBoss(data);
        setSynced(true);
      } else {
        setDoc(bossDoc, initialBossData).then(() => setSynced(true)).catch(console.error);
      }
    }, (error) => {
      console.warn("Firestore sync failed.", error);
      setSynced(false);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.status]); 

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setBattleLog([`The Grimoire revealed secrets of ${data.subject || "magic"}! Battle begins!`, ...battleLog].slice(0, 6));
      } else {
        alert("Upload Failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("A disruption in the aether occurred.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const finalizeRaid = async (finalAnswered: number, finalCorrect: number, finalMastery: number, finalHp: number) => {
    if (isFinalizing) return;
    setIsFinalizing(true);
    
    // We compute total spells available
    const totalSpells = boss.spells?.length || 5;
    const accuracy = totalSpells > 0 ? (finalCorrect / totalSpells) : 0;
    const elapsedSeconds = Math.floor((Date.now() - raidStats.startTime) / 1000);

    // Save to study logs
    try {
      await addDoc(collection(db, "study_logs"), {
        subject: boss.subject || "Unknown",
        accuracy_rate: accuracy,
        time_elapsed_seconds: elapsedSeconds,
        mastery_score: finalMastery,
        win: finalHp <= 0,
        timestamp: Date.now()
      });
      // Delay unmount to let final animation play
      setTimeout(async () => {
        await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [] }, { merge: true });
        setBattleLog([`Raid Completed! Accuracy: ${Math.round(accuracy * 100)}% | Mastery Granted: ${finalMastery}`]);
      }, 1500);
    } catch(err) {
      console.error("Failed to archive raid logs", err);
    }
  };

  const handleAttack = async (spell: any, selectedOption: string) => {
    if (!boss || isFinalizing) return;
    
    let newHp = boss.hp;
    let newLog = "";
    const isCorrect = selectedOption === spell.answer;
    
    // Progress Raid Trackers
    const difficultyVal = spell.difficulty || 2; // default if API missing
    const newAnswered = raidStats.answered + 1;
    const newCorrect = raidStats.correct + (isCorrect ? 1 : 0);
    const newMastery = raidStats.mastery + (isCorrect ? difficultyVal * 100 : 0);
    
    setRaidStats({ startTime: raidStats.startTime, answered: newAnswered, correct: newCorrect, mastery: newMastery });

    if (isCorrect) {
      newHp = Math.max(0, boss.hp - 1000);
      newLog = `Royce unraveled the concept! It's super effective! +${difficultyVal * 100} Mastery.`;
      setIsLightning(true);
      setTimeout(() => setIsLightning(false), 800);
    } else {
      newHp = Math.min(boss.maxHp, boss.hp + 500);
      newLog = `The Boss uses 'Mental Block'! Royce chose poorly. The Boss heals 500 HP!`;
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setBattleLog(prev => [newLog, ...prev].slice(0, 6));

    try {
      await setDoc(doc(db, "gameData", "boss"), { hp: newHp }, { merge: true });
    } catch (err) {
      console.error("Failed to commit attack", err);
    }

    // Checking Victory or Consumed Spells condition
    if (newHp <= 0 || newAnswered >= (boss.spells?.length || 5)) {
       finalizeRaid(newAnswered, newCorrect, newMastery, newHp);
    }
  };

  const handleRetreat = async () => {
    setShowRetreatModal(false);
    setBattleLog(["Royce retreated back to the Nexus. The battle is paused.", ...battleLog].slice(0, 6));
    try {
      await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [] }, { merge: true });
    } catch(err) {
      console.error("Retreat failed:", err);
    }
  };

  const hpPercentage = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const theme = getTheme(boss.subject);

  return (
    <div className={`min-h-screen bg-black text-slate-200 font-sans flex flex-col items-center p-8 overflow-x-hidden relative selection:bg-red-900 selection:text-white pb-32 transition-transform ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* Top Application Navigation */}
      <nav className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black/50 p-2 rounded-full border border-zinc-900 backdrop-blur-md">
        <button 
          onClick={() => setCurrentView('forge')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold tracking-widest uppercase text-xs transition-colors ${currentView === 'forge' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          <Swords size={16} /> The Forge
        </button>
        <button 
          onClick={() => setCurrentView('analytics')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold tracking-widest uppercase text-xs transition-colors ${currentView === 'analytics' ? 'bg-purple-900/40 text-purple-200 border border-purple-800/50' : 'text-zinc-500 hover:text-white'}`}
        >
          <BarChart3 size={16} /> Hall of Records
        </button>
      </nav>

      {/* Retreat Confirmation Modal */}
      <AnimatePresence>
        {showRetreatModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-red-900/50 p-8 rounded-3xl flex flex-col items-center gap-6 max-w-sm shadow-[0_0_50px_-15px_rgba(220,38,38,0.4)]"
            >
              <ShieldAlert className="text-red-500 w-12 h-12" />
              <h3 className="text-xl font-bold text-red-100 text-center tracking-widest uppercase">Abandon Battle?</h3>
              <p className="text-zinc-400 text-sm text-center">Are you sure you want to retreat to the Nexus? The current spells will be discarded.</p>
              <div className="flex w-full gap-4 mt-4">
                <button onClick={() => setShowRetreatModal(false)} className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-semibold transition-colors">Cancel</button>
                <button onClick={handleRetreat} className="flex-1 py-3 bg-red-900/80 hover:bg-red-800 text-red-100 rounded-xl font-semibold transition-colors shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)] tracking-widest uppercase text-sm">Retreat</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-red-600/30 mix-blend-screen pointer-events-none z-[80]" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLightning && (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100]" viewBox="0 0 100 100" preserveAspectRatio="none">
             <motion.path 
                 d="M 12 80 L 25 55 L 18 50 L 50 15" fill="transparent" stroke={theme.boltHard} strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                 initial={{ pathLength: 0, opacity: 1, filter: `drop-shadow(0 0 10px ${theme.boltHard})` }} animate={{ pathLength: 1, opacity: 0, filter: `drop-shadow(0 0 30px ${theme.boltHard})` }} transition={{ duration: 0.6, ease: "easeOut" }} 
             />
             <motion.path 
                 d="M 12 80 L 30 65 L 25 45 L 50 15" fill="transparent" stroke={theme.boltSoft} strokeWidth="0.8" vectorEffect="non-scaling-stroke"
                 initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }} 
             />
          </svg>
        )}
      </AnimatePresence>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      {synced && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-green-400 font-mono opacity-60">
          <Zap size={14} /> Arbiter Eye Connected
        </div>
      )}

      {currentView === 'analytics' ? (
        <main className="z-10 relative flex flex-col items-center w-full max-w-5xl gap-12 pt-24">
          <AnalyticsView />
        </main>
      ) : (
        <main className="z-10 relative flex flex-col items-center w-full max-w-5xl gap-12">
          <div className="text-center space-y-4 pt-24">
            <h1 className="text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 flex items-center justify-center gap-4">
              <ShieldAlert className="text-red-600 w-12 h-12" />
              Arcanum Academics
              <ShieldAlert className="text-red-600 w-12 h-12" />
            </h1>
          </div>

          <div className="w-full flex flex-col items-center gap-6 p-8 bg-zinc-950/80 backdrop-blur-md rounded-3xl border border-red-950 shadow-[0_0_50px_-15px_rgba(220,38,38,0.2)]">
            <h2 className="text-3xl font-bold tracking-widest text-red-100">{boss.name}</h2>
            
            <div className="w-full max-w-3xl h-12 bg-zinc-900 rounded-full overflow-hidden border-2 border-red-950/50 shadow-inner relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 relative"
                initial={{ width: '100%' }}
                animate={{ width: `${hpPercentage}%` }}
                transition={{ duration: 0.8, type: 'spring' }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-16 bg-white/20 blur-md rounded-full" />
              </motion.div>
            </div>
            <div className="flex w-full max-w-3xl justify-between px-2 font-mono text-red-400 tracking-widest font-bold">
              <span>HP // {boss.hp}</span>
              <span>MAX // {boss.maxHp}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {boss.status === 'battle_active' ? (
              <motion.div 
                key="battle-arena"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full flex flex-col gap-8 p-10 ${theme.bgLight} backdrop-blur-sm rounded-3xl border ${theme.border} ${theme.glow} relative transition-colors duration-1000`}
              >
                {/* Escape / Retreat Button */}
                <button 
                  onClick={() => setShowRetreatModal(true)}
                  className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-red-200 rounded-full border border-red-900/50 transition-all z-40 text-xs font-bold tracking-widest uppercase hover:shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)]"
                  title="Retreat to Nexus"
                >
                  <LogOut size={16} /> Retreat
                </button>

                <div className="fixed bottom-36 -left-12 opacity-80 pointer-events-none drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20 hidden lg:block">
                  <svg width="300" height="400" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50 C60 50 40 100 30 200 L170 200 C160 100 140 50 100 50 Z" fill="#1e1b4b" stroke={theme.hex} strokeWidth="4" />
                    <path d="M100 70 C80 70 70 90 70 120 C70 150 80 160 100 160 C120 160 130 150 130 120 C130 90 120 70 100 70 Z" fill="#020617"/>
                    <circle cx="85" cy="110" r="4" fill={theme.boltSoft} filter={`drop-shadow(0 0 5px ${theme.boltSoft})`}/>
                    <circle cx="115" cy="110" r="4" fill={theme.boltSoft} filter={`drop-shadow(0 0 5px ${theme.boltSoft})`}/>
                    
                    <path d="M160 250 L140 50 L135 15 L145 10 L155 40 Z" fill={theme.staffDark} />
                    <circle cx="140" cy="10" r="15" fill={theme.staffFlash} filter={`drop-shadow(0 0 15px ${theme.staffFlash})`}/>
                    <path d="M140 -5 L140 25 M125 10 L155 10 M130 0 L150 20 M130 20 L150 0" stroke={theme.boltSoft} strokeWidth="2" opacity="0.8"/>
                  </svg>
                </div>

                <h3 className={`text-2xl font-black tracking-widest ${theme.text} uppercase text-center flex items-center justify-center gap-3 transition-colors duration-1000`}>
                  <Zap className={theme.text} />
                  Arena » {boss.subject}
                  <Zap className={theme.text} />
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-30">
                  {boss.spells && boss.spells.map((spell: any, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 50, rotateX: -20 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: index * 0.15 + 0.3, type: "spring", stiffness: 100 }}
                      className={`px-6 py-8 bg-black/80 rounded-2xl border ${theme.border} flex flex-col gap-6 shadow-2xl relative overflow-hidden group hover:${theme.borderHeavy} transition-colors`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-white/10" style={{ background: theme.hex }} />
                      <p className="text-slate-100 font-semibold text-lg leading-relaxed pl-2 z-10">{index + 1}. {spell.question}</p>
                      
                      <div className="grid grid-cols-1 gap-3 z-10 font-mono text-sm">
                        {["A", "B", "C", "D"].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => handleAttack(spell, opt)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-300 border backdrop-blur-sm relative overflow-hidden bg-zinc-900/80 border-zinc-700 ${theme.btnHover} group/btn`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-700`} />
                            <span className={`font-bold mr-3 ${theme.text}`}>[{opt}]</span>
                            <span className="text-slate-300">{spell[opt]}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="upload-arena"
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 p-16 bg-zinc-900/40 rounded-3xl border border-zinc-900/50 hover:bg-zinc-900/60 transition-all backdrop-blur-sm z-30"
              >
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="group relative flex items-center gap-4 px-16 py-8 bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 active:from-stone-900 active:to-black rounded-full border-2 border-stone-700 text-stone-200 uppercase tracking-[0.4em] font-black transition-all shadow-[0_0_50px_-5px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                  <Flame className={`w-10 h-10 text-orange-500 ${uploading ? 'animate-pulse' : 'group-hover:text-orange-400 transition-colors'}`} />
                  <span className="text-lg">{uploading ? "Forging..." : "The Sacrifice"}</span>
                  <Upload className={`w-8 h-8 text-stone-400 ${uploading ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'}`} />
                </button>
                
                <p className="text-zinc-500 font-mono text-sm tracking-widest text-center max-w-md">
                  {uploading ? "Identifying subject and forging related concepts..." : "Offer Grimoires (PDFs) to forge new Spell Cards and ignite the arena."}
                </p>
                
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleUpload}/>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Battle Log Nexus */}
      <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-zinc-900 p-6 z-50 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.8)]">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 h-32 overflow-hidden relative">
          <h4 className={`${theme.text} font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors`}>
            <BookOpen size={14} /> Battle Log Archive
          </h4>
          <AnimatePresence>
            <div className="flex flex-col gap-2 font-mono text-sm opacity-90">
              {battleLog.map((log, index) => (
                <motion.div 
                  key={log + index} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: index === 0 ? 1 : 0.5, x: 0, scale: index === 0 ? 1 : 0.98 }}
                  className={`flex items-center gap-2 ${index === 0 ? 'text-white font-bold' : 'text-slate-500'}`}
                >
                  {index === 0 && <span className={theme.text}>»</span>}
                  {log}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
