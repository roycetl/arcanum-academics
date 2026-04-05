"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Flame, ShieldAlert, Zap, BookOpen, LogOut, BarChart3, Swords, ScanEye, Droplet } from "lucide-react";
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
  return { 
    border: "border-indigo-900/50", borderHeavy: "border-indigo-500", glow: "shadow-[0_0_60px_-15px_rgba(79,70,229,0.2)]", 
    text: "text-indigo-400", bgLight: "bg-indigo-950/20", btnHover: "hover:bg-indigo-900/40 hover:border-indigo-500 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)]",
    staffDark: "#312e81", staffFlash: "#818cf8", boltSoft: "#c7d2fe", boltHard: "#818cf8", hex: "#818cf8"
  };
}

const PRESETS = [
  { id: 'easy', label: 'Easy', value: 60 },
  { id: 'medium', label: 'Medium', value: 75 },
  { id: 'hard', label: 'Hard', value: 90 },
  { id: 'legendary', label: 'Legendary', value: 95 },
  { id: 'custom', label: 'Custom', value: null }
];

const LANGUAGES = [
  "Arabic — العربية", "Chinese (Simplified) — 简体中文", "Chinese (Traditional) — 繁體中文", 
  "Dutch — Nederlands", "English — English", "French — Français", "German — Deutsch", 
  "Hindi — हिन्दी", "Indonesian — Bahasa Indonesia", "Italian — Italiano", "Japanese — 日本語", 
  "Korean — 한국어", "Polish — Polski", "Portuguese (Brazil) — Português (Brasil)", 
  "Spanish — Español", "Thai — ไทย", "Turkish — Türkçe", "Vietnamese — Tiếng Việt"
];

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-8 p-10 bg-zinc-950/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative">
      <h3 className="text-3xl font-black tracking-widest text-slate-200 uppercase text-center flex items-center justify-center gap-3">
        <BarChart3 className="text-slate-500" /> Hall of Records <BarChart3 className="text-slate-500" />
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
                <motion.div initial={{ width: 0 }} animate={{ width: `${stat.avgAccuracy * 100}%` }} transition={{ duration: 1, delay: i * 0.1, type: "spring" }} className="h-full bg-gradient-to-r from-purple-900 to-purple-500 relative">
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
  const [forgeMode, setForgeMode] = useState<'SELECT' | 'RITUAL'>('SELECT');

  // POV Battle State
  const [battlePhase, setBattlePhase] = useState<'QUESTIONING' | 'BATTLING' | 'FAILED' | 'VICTORY'>('QUESTIONING');
  const [currentSpellIndex, setCurrentSpellIndex] = useState(0);
  const [wizardHP, setWizardHP] = useState(100);
  const [goblinHP, setGoblinHP] = useState(100);
  const [lastAction, setLastAction] = useState<'CORRECT' | 'INCORRECT' | null>(null);

  // Ritual Configuration State
  const [ritualConfig, setRitualConfig] = useState<{ quantity: number, difficulty: string, threshold: number, targetLanguage: string }>({ 
    quantity: 5, difficulty: 'medium', threshold: 75, targetLanguage: 'English — English'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error/Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Raid & Interaction State
  const [raidStats, setRaidStats] = useState({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const bossDoc = doc(db, "gameData", "boss");
    const unsub = onSnapshot(bossDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        if (data.status === "battle_active" && boss.status !== "battle_active") {
            setBattleLog([`The Battle has commenced in the Realm of ${data.subject || "Antiquity"}!`]);
            setRaidStats({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
            setIsFinalizing(false);
            setBattlePhase('QUESTIONING');
            setCurrentSpellIndex(0);
            setWizardHP(100);
            setGoblinHP(100);
            setLastAction(null);
            if (data.spells && Array.isArray(data.spells)) {
                data.spells = [...data.spells].sort(() => Math.random() - 0.5);
            }
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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    let timer: any;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setToastMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quantity", String(ritualConfig.quantity));
    formData.append("threshold", String(ritualConfig.threshold));
    formData.append("targetLanguage", ritualConfig.targetLanguage);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setBattleLog([`The Grimoire revealed secrets of ${data.subject || "magic"}! Battle begins!`, ...battleLog].slice(0, 6));
      } else if (res.status === 429) {
        setToastMessage(data.error);
        setCooldownSeconds(data.retryDelay || 60);
      } else {
        setToastMessage("Upload Failed: " + (data.details || data.error));
      }
    } catch (error) {
      console.error(error);
      setToastMessage("A disruption in the aether occurred. The ritual was violently interrupted.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const finalizeRaid = async (finalAnswered: number, finalCorrect: number, finalMastery: number) => {
    if (isFinalizing) return;
    setIsFinalizing(true);
    
    const totalSpells = boss.spells?.length || ritualConfig.quantity;
    const accuracy = totalSpells > 0 ? (finalCorrect / totalSpells) : 0;
    const requiredAccuracy = (boss.threshold || ritualConfig.threshold) / 100;
    const elapsedSeconds = Math.floor((Date.now() - raidStats.startTime) / 1000);
    const isWin = accuracy >= requiredAccuracy;
    
    try {
      await addDoc(collection(db, "study_logs"), {
        subject: boss.subject || "Unknown",
        accuracy_rate: accuracy,
        time_elapsed_seconds: elapsedSeconds,
        mastery_score: finalMastery,
        win: isWin,
        timestamp: Date.now()
      });
      setTimeout(async () => {
        await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [], hp: boss.maxHp }, { merge: true });
        setBattleLog([isWin ? `Boss Vanquished! Accuracy: ${Math.round(accuracy * 100)}% | Mastery: ${finalMastery}` : `Spell Fizzle! Accuracy: ${Math.round(accuracy * 100)}%. The Arcane Threshold was not met.`]);
      }, 1500);
    } catch(err) {
      console.error("Failed to archive raid", err);
    }
  };

  const handleAttack = async (spell: any, selectedOption: string) => {
    if (!boss || isFinalizing || battlePhase !== 'QUESTIONING') return;
    
    setBattlePhase('BATTLING');
    let newLog = "";
    const isCorrect = selectedOption === spell.answer;
    setLastAction(isCorrect ? 'CORRECT' : 'INCORRECT');
    
    const difficultyVal = spell.difficulty || 2;
    const newAnswered = raidStats.answered + 1;
    const newCorrect = raidStats.correct + (isCorrect ? 1 : 0);
    const newMastery = raidStats.mastery + (isCorrect ? difficultyVal * 100 : 0);
    
    setRaidStats({ startTime: raidStats.startTime, answered: newAnswered, correct: newCorrect, mastery: newMastery });

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAnswer: selectedOption, questionIndex: currentSpellIndex })
      });
      const data = await res.json();

      if (data.success) {
        newLog = `[${data.spellCast || 'Evaded'}] ${data.message} ${isCorrect ? `(+${difficultyVal * 100} Mastery)` : ''}`;
        setBattleLog(prev => [newLog, ...prev].slice(0, 6));
        setWizardHP(data.newPlayerHp);
        
        if (isCorrect) {
          // Gained a spell
        } else {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      }
    } catch (err) {
      console.error("Failed to commit attack through spell API", err);
    }

    setTimeout(async () => {
       if (wizardHP <= 0 || boss.playerHp <= 0) {
          setBattlePhase('FAILED');
          try { await setDoc(doc(db, "gameData", "boss"), { hp: boss.maxHp }, { merge: true }); } catch (err) {}
       } else if ((newAnswered >= (boss.spells?.length || ritualConfig.quantity)) && (!boss.playerHand || boss.playerHand.length === 0)) {
          setBattlePhase('VICTORY');
          finalizeRaid(newAnswered, newCorrect, newMastery);
       } else {
          if (newAnswered < (boss.spells?.length || ritualConfig.quantity)) {
             setCurrentSpellIndex(prev => prev + 1);
          }
          setBattlePhase('QUESTIONING');
          setLastAction(null);
       }
    }, 2500);
  };

  const handleCastSpell = async (index: number) => {
    if (!boss || isFinalizing) return;
    
    try {
      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spellIndex: index })
      });
      const data = await res.json();
      
      if (data.success) {
        setGoblinHP(data.newEnemyHp);
        const newLog = `💥 Cast [${data.spellCast}]! ${data.message}`;
        setBattleLog(prev => [newLog, ...prev].slice(0, 6));
        setIsLightning(true);
        setBattlePhase('BATTLING');
        setLastAction('CORRECT');
        setTimeout(() => { setIsLightning(false); setBattlePhase('QUESTIONING'); setLastAction(null) }, 800);
        
        if (data.newEnemyHp <= 0) {
           setBattlePhase('VICTORY');
           finalizeRaid(raidStats.answered, raidStats.correct, raidStats.mastery);
        } else if (raidStats.answered >= (boss.spells?.length || ritualConfig.quantity) && data.newHand.length === 0) {
           setBattlePhase('VICTORY');
           finalizeRaid(raidStats.answered, raidStats.correct, raidStats.mastery);
        }
      }
    } catch (err) {
      console.error("Failed to sequence cast", err);
    }
  };

  const handleRetryBattle = () => {
     setBattlePhase('QUESTIONING');
     setCurrentSpellIndex(0);
     setWizardHP(100);
     setGoblinHP(100);
     setLastAction(null);
     setRaidStats({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
     setBattleLog(["The Grimoire opens once more. Second chances are rare..."]);
     if (boss.spells && Array.isArray(boss.spells)) {
         const shuffled = [...boss.spells].sort(() => Math.random() - 0.5);
         setBoss({...boss, spells: shuffled});
     }
  };

  const handleReturnToMenu = async () => {
     try {
       await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [] }, { merge: true });
       setForgeMode('SELECT');
       window.scrollTo({ top: 0, behavior: "smooth" }); 
     } catch(err) {}
  };

  const handleRetreat = async () => {
    setShowRetreatModal(false);
    setForgeMode('SELECT');
    setBattleLog(["Royce retreated back to the Nexus. The battle is paused.", ...battleLog].slice(0, 6));
    try {
      await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [], hp: 100, maxHp: 100, enemyHp: 100, playerHp: 100 }, { merge: true });
    } catch(err) {}
  };

  const hpPercentage = Math.max(0, Math.min(100, (goblinHP / 100) * 100));
  const theme = getTheme(boss.subject);

  return (
    <div className={`min-h-screen bg-black text-slate-200 font-sans flex flex-col items-center p-8 overflow-x-hidden relative selection:bg-red-900 selection:text-white pb-32 transition-transform ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* Toast Error Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-red-950/80 border border-red-500 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_-5px_rgba(220,38,38,0.6)] backdrop-blur-md max-w-xl w-[90%]"
          >
            <ShieldAlert className="text-red-400 w-8 h-8 shrink-0" />
            <div className="flex flex-col">
              <span className="text-red-100 font-black tracking-widest uppercase text-sm">Spell Fizzle</span>
              <span className="text-red-300 font-mono text-xs">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-red-500 hover:text-red-300 font-bold p-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mana Well (Rate Limit Cooldown UI) */}
      <AnimatePresence>
        {cooldownSeconds > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="fixed bottom-36 right-8 z-[150] flex flex-col items-center justify-center gap-2 pointer-events-none"
          >
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] backdrop-blur-md">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-cyan-900" />
                 <motion.circle 
                    cx="32" cy="32" r="28" fill="none" strokeWidth="4" 
                    strokeDasharray="176" 
                    strokeDashoffset={176 - (176 * (cooldownSeconds / 60))} 
                    className="stroke-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" 
                    transition={{ ease: "linear" }}
                 />
               </svg>
               <Droplet className="text-cyan-300 w-6 h-6 animate-pulse" />
            </div>
            <span className="text-cyan-300 font-bold uppercase tracking-widest text-[10px] bg-cyan-950/80 px-3 py-1 rounded border border-cyan-800 backdrop-blur-sm">Regenerating: {cooldownSeconds}s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black/80 p-2 rounded-full border border-emerald-950/50 backdrop-blur-md">
        <button onClick={() => setCurrentView('forge')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-serif tracking-widest uppercase text-xs transition-all duration-300 ${currentView === 'forge' ? 'bg-emerald-900/40 text-[#ffcba4] border border-[#ff7f50]/40 shadow-[0_0_20px_-5px_rgba(255,127,80,0.4)]' : 'text-emerald-700 hover:text-[#98ff98]'}`}>
          <Swords size={16} /> The Forge
        </button>
        <button onClick={() => setCurrentView('analytics')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-serif tracking-widest uppercase text-xs transition-all duration-300 ${currentView === 'analytics' ? 'bg-emerald-900/40 text-[#ffcba4] border border-[#ff7f50]/40 shadow-[0_0_20px_-5px_rgba(255,127,80,0.4)]' : 'text-emerald-700 hover:text-[#98ff98]'}`}>
          <BarChart3 size={16} /> Hall of Records
        </button>
      </nav>

      {/* Retreat Confirmation Modal */}
      <AnimatePresence>
        {showRetreatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-950 border border-red-900/50 p-8 rounded-3xl flex flex-col items-center gap-6 max-w-sm shadow-[0_0_50px_-15px_rgba(220,38,38,0.4)]">
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
        {isShaking && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-red-600/30 mix-blend-screen pointer-events-none z-[80]" />}
      </AnimatePresence>

      <AnimatePresence>
        {isLightning && (
          <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100]" viewBox="0 0 100 100" preserveAspectRatio="none">
             <motion.path d="M 12 80 L 25 55 L 18 50 L 50 15" fill="transparent" stroke={theme.boltHard} strokeWidth="1.5" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 1, filter: `drop-shadow(0 0 10px ${theme.boltHard})` }} animate={{ pathLength: 1, opacity: 0, filter: `drop-shadow(0 0 30px ${theme.boltHard})` }} transition={{ duration: 0.6, ease: "easeOut" }} />
             <motion.path d="M 12 80 L 30 65 L 25 45 L 50 15" fill="transparent" stroke={theme.boltSoft} strokeWidth="0.8" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }} />
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
        <main className="z-10 relative flex flex-col items-center w-full max-w-5xl gap-12 pt-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-morris tracking-widest uppercase text-white flex items-center justify-center gap-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Flame className="text-emerald-500 w-12 h-12" /> STUDIFY <Flame className="text-emerald-500 w-12 h-12" />
            </h1>
          </div>

          <div className="w-full flex flex-col items-center gap-6 p-8 bg-[#050a07]/80 backdrop-blur-md rounded-3xl border border-[#ff7f50]/30 shadow-[0_0_50px_-15px_rgba(255,127,80,0.3)]">
            <h2 className="text-3xl font-serif italic tracking-widest text-[#ffcba4] text-center drop-shadow-[0_0_10px_rgba(255,203,164,0.4)]">GOBLIN ({boss.name})</h2>
            <div className="w-full max-w-3xl h-12 bg-black rounded-full overflow-hidden border-2 border-[#ff7f50]/40 shadow-inner relative">
              <motion.div className="h-full bg-gradient-to-r from-[#ffcba4] via-[#ff7f50] to-[#ff4500] relative" initial={{ width: '100%' }} animate={{ width: `${hpPercentage}%` }} transition={{ duration: 0.8, type: 'spring' }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-16 bg-white/30 blur-md rounded-full" />
              </motion.div>
            </div>
            <div className="flex w-full max-w-3xl justify-between px-2 font-mono tracking-widest font-bold">
              <span className="text-red-400">HP // {Math.round(goblinHP)}</span>
              {boss.status === "battle_active" && (
                <div className="flex gap-6 text-xs text-slate-500 uppercase items-center">
                  <span className="text-indigo-400 border border-indigo-900/50 bg-indigo-950/30 px-3 py-1 rounded">Threshold: {boss.threshold}%</span>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {boss.status === 'battle_active' ? (
              <motion.div 
                key="battle-arena"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full h-[600px] flex flex-col bg-black rounded-3xl border border-emerald-900 shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden`}
              >
                <button onClick={() => setShowRetreatModal(true)} className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-red-200 rounded-full border border-red-900/50 transition-all z-50 text-xs font-bold tracking-widest uppercase shadow-md">
                  <LogOut size={16} /> Retreat
                </button>

                {/* Local HUD - HP Bars */}
                <div className="absolute top-6 left-6 flex flex-col gap-4 z-40 w-64 pointer-events-none">
                   <div className="flex flex-col gap-1">
                      <span className="text-emerald-400 font-morris tracking-widest text-lg drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">WIZARD</span>
                      <div className="w-full h-3 bg-zinc-900 border border-emerald-900 rounded-full overflow-hidden shadow-inner relative">
                         <motion.div animate={{ width: `${wizardHP}%` }} transition={{ type: "spring", bounce: 0 }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative">
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
                         </motion.div>
                      </div>
                   </div>
                </div>

                <div className="absolute inset-0 bg-black z-0 pointer-events-none" />

                {/* Goblin */}
                <motion.div 
                  className="absolute top-[10%] left-1/2 -translate-x-1/2 z-10 drop-shadow-[0_0_20px_rgba(232,165,184,0.3)]"
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
                   <svg width="200" height="200" viewBox="0 0 100 100" fill="#e8a5b8">
                      <path d="M50 20 C30 20 20 40 20 60 C20 80 40 90 50 90 C60 90 80 80 80 60 C80 40 70 20 50 20 Z" />
                      <circle cx="35" cy="50" r="8" fill="#111" />
                      <circle cx="65" cy="50" r="8" fill="#111" />
                      <path d="M40 70 Q50 80 60 70" stroke="#111" strokeWidth="3" fill="none" />
                      <path d="M25 40 L5 20 L28 35 Z" />
                      <path d="M75 40 L95 20 L72 35 Z" />
                   </svg>
                </motion.div>

                {/* Wizard Hands */}
                <div className="absolute bottom-0 left-8 z-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                   <motion.svg width="250" height="300" viewBox="0 0 100 100" animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                      <path d="M10 90 L90 90 L80 50 L20 50 Z" fill="#2d1a11" />
                      <path d="M20 50 L45 40 L50 90 L20 90 Z" fill="#fcd34d" />
                      <path d="M80 50 L55 40 L50 90 L80 90 Z" fill="#fef3c7" />
                      <path d="M25 55 L40 55 M25 65 L40 65 M60 55 L75 55 M60 65 L75 65" stroke="#111" strokeWidth="2" opacity="0.4"/>
                      <path d="M25 75 L40 75 M60 75 L75 75" stroke="#b45309" strokeWidth="2" opacity="0.8"/>
                   </motion.svg>
                </div>
                
                {/* Staff */}
                <div className="absolute bottom-[-50px] right-8 z-10 origin-bottom">
                   <motion.svg width="200" height="600" viewBox="0 0 400 400" animate={ battlePhase === 'BATTLING' && lastAction === 'CORRECT' ? { rotate: [0, -20, 0], y: [0, -80, 0] } : { y: [0, 20, 0] } } transition={ battlePhase === 'BATTLING' ? { duration: 0.5 } : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                      <path d="M180 400 Q190 200 200 100" stroke="#1c0f0a" strokeWidth="60" fill="none" strokeLinecap="round" />
                      <path d="M180 400 Q190 200 200 100" stroke="#2d1a11" strokeWidth="40" fill="none" strokeLinecap="round" />
                      <path d="M200 100 L120 20 L280 20 Z" fill="#10b981" opacity="0.9" filter="drop-shadow(0 0 20px #34d399)" />
                      <polygon points="200,0 150,20 250,20" fill="#a7f3d0" />
                   </motion.svg>
                </div>

                {/* Projectile */}
                <AnimatePresence>
                   {battlePhase === 'BATTLING' && lastAction === 'CORRECT' && (
                      <motion.div
                         className="absolute w-20 h-20 rounded-full bg-emerald-400 drop-shadow-[0_0_60px_rgba(16,185,129,1)] z-20 mix-blend-screen"
                         initial={{ bottom: '20%', right: '15%', scale: 0.5, opacity: 1 }}
                         animate={{ bottom: '70%', right: '50%', scale: 2, opacity: 0 }}
                         transition={{ duration: 0.6, ease: "easeIn" }}
                      />
                   )}
                </AnimatePresence>

                {/* Spell Card Interface */}
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
                      <div className="w-full max-w-2xl px-10 py-12 bg-[#030a06]/95 backdrop-blur-xl rounded-3xl border border-emerald-500 shadow-[0_0_60px_-10px_rgba(16,185,129,0.4)] flex flex-col gap-8 pointer-events-auto">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" />
                        <h3 className="text-emerald-400 font-serif italic text-center uppercase tracking-widest text-xs mb-[-10px]">
                           Spell Card {currentSpellIndex + 1} / {boss.spells.length}
                        </h3>
                        <p className="text-white font-serif text-2xl leading-relaxed text-center z-10 whitespace-pre-wrap drop-shadow-md">
                           {boss.spells[currentSpellIndex].question}
                        </p>
                        <div className="grid grid-cols-1 gap-4 z-10 w-full mt-4">
                          {["A", "B", "C", "D"].map((opt) => (
                            <button key={opt} onClick={() => handleAttack(boss.spells[currentSpellIndex], opt)} className="w-full text-left p-5 rounded-2xl transition-all duration-300 border backdrop-blur-sm relative overflow-hidden bg-black border-emerald-900/50 hover:border-emerald-400 hover:bg-emerald-900/30 group/btn shadow-inner">
                              <span className="font-serif italic font-bold mr-4 text-emerald-400 group-hover/btn:text-[#ffcba4] transition-colors">[{opt}]</span>
                              <span className="text-emerald-100 font-serif text-lg whitespace-pre-wrap">{boss.spells[currentSpellIndex][opt]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Blur overlay when card open */}
                <AnimatePresence>
                   {battlePhase === 'QUESTIONING' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[6px] pointer-events-none" />
                   )}
                </AnimatePresence>
                
                {/* Quest Failed Overlay */}
                <AnimatePresence>
                   {battlePhase === 'FAILED' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8">
                         <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="flex flex-col items-center gap-8 max-w-lg w-full">
                            <div className="w-full py-4 border-y border-emerald-900/50 bg-[#ff7f50]/10 flex justify-center shadow-[0_0_30px_rgba(255,127,80,0.2)]">
                               <h1 className="text-5xl font-morris tracking-widest text-[#ff7f50] drop-shadow-[0_0_10px_rgba(255,127,80,0.8)]">QUEST FAILED</h1>
                            </div>
                            <p className="text-emerald-400 font-serif text-lg text-center font-bold px-4">Your life force has been depleted. The Goblin mocks your attempt at mastery.</p>
                            <div className="flex flex-col w-full gap-4 mt-8 px-8">
                               <button onClick={handleRetryBattle} className="w-full py-4 text-emerald-100 bg-emerald-950/40 border border-emerald-500 rounded-xl hover:bg-emerald-900/60 transition-colors font-serif uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">[ RETRY RITUAL ]</button>
                               <button onClick={handleReturnToMenu} className="w-full py-4 text-zinc-400 bg-black border border-emerald-900/40 rounded-xl hover:text-emerald-400 hover:border-emerald-700 transition-colors font-serif uppercase tracking-widest text-sm">[ RETURN TO MENU ]</button>
                            </div>
                         </motion.div>
                      </motion.div>
                   )}
                </AnimatePresence>

                {/* Victory Overlay */}
                <AnimatePresence>
                   {battlePhase === 'VICTORY' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-[#050f0a]/95 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                         <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="flex flex-col items-center gap-8 max-w-lg w-full">
                            <div className="w-full py-4 flex justify-center">
                               <h1 className="text-5xl font-morris tracking-widest text-[#98ff98] drop-shadow-[0_0_30px_rgba(152,255,152,0.8)]">SACRIFICE ACCEPTED</h1>
                            </div>
                            <p className="text-emerald-100 font-serif text-lg text-center font-bold px-4">The grimoire yields its secrets. You have prevailed!</p>
                            <div className="flex flex-col w-full gap-4 mt-8 px-8">
                               <button onClick={handleReturnToMenu} className="w-full py-4 text-[#050a07] font-bold bg-[#98ff98] border border-[#98ff98] rounded-xl hover:bg-emerald-400 transition-colors font-serif uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(152,255,152,0.5)]">[ RETURN TO MENU ]</button>
                            </div>
                         </motion.div>
                       </motion.div>
                   )}
                </AnimatePresence>
              </motion.div>
            ) : forgeMode === 'SELECT' ? (
               <motion.div 
                 key="mode-select"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="flex flex-col items-center gap-8 w-full max-w-lg z-30 pt-10"
               >
                 <div className="flex flex-col w-full gap-6">
                   <button onClick={() => setForgeMode('RITUAL')} className="group relative flex items-center justify-start gap-6 px-10 py-8 bg-[#050f0a]/80 backdrop-blur-md rounded-3xl border border-emerald-500/50 hover:border-emerald-400 hover:bg-[#07170a]/90 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)] overflow-hidden w-full cursor-pointer">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/30 group-hover:border-emerald-400 group-hover:bg-emerald-900/40 transition-colors">
                         <Flame className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                         <span className="text-emerald-100 font-morris uppercase tracking-widest text-2xl drop-shadow-sm group-hover:text-white">The Sacrifice</span>
                         <span className="text-emerald-500 font-serif italic text-sm tracking-wide">Enter the Deckbuilder Battle</span>
                      </div>
                   </button>
 
                   <button onClick={() => window.location.href='/api/gamify'} className="group relative flex items-center justify-start gap-6 px-10 py-8 bg-[#030510]/80 backdrop-blur-md rounded-3xl border border-indigo-900/50 hover:border-indigo-400 hover:bg-[#05081f]/90 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(79,70,229,0.2)] hover:shadow-[0_0_50px_-10px_rgba(79,70,229,0.4)] overflow-hidden w-full cursor-pointer">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-950/50 border border-indigo-500/30 group-hover:border-indigo-400 group-hover:bg-indigo-900/40 transition-colors">
                         <BookOpen className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                         <span className="text-indigo-100 font-morris uppercase tracking-widest text-2xl drop-shadow-sm group-hover:text-white">Trial of the Tome</span>
                         <span className="text-indigo-500 font-serif italic text-sm tracking-wide">Upload &amp; Conquer Your Exam</span>
                      </div>
                   </button>
                 </div>
               </motion.div>
            ) : (
              <motion.div 
                key="upload-arena"
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8 w-full max-w-lg z-30"
              >
                {/* Ritual Configurator */}
                <div className="bg-[#050f0a]/60 p-8 rounded-3xl border border-emerald-500/50 w-full flex flex-col gap-8 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] backdrop-blur-xl">
                  <div className="text-white font-morris tracking-widest text-2xl uppercase text-center flex items-center justify-center gap-3">
                    <ScanEye className="text-emerald-400 w-6 h-6 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"/> THE RITUAL SETTINGS
                  </div>
                  
                  {/* Language */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-serif italic text-white tracking-widest pl-1 drop-shadow-md">Incantation Language</label>
                    <div className="relative w-full">
                      <select 
                        value={ritualConfig.targetLanguage} 
                        onChange={(e) => setRitualConfig(p => ({...p, targetLanguage: e.target.value}))}
                        className="w-full bg-[#030a06] border border-emerald-900/50 rounded-xl py-4 px-5 text-[#98ff98] font-serif hover:border-emerald-500/80 focus:outline-none focus:border-[#98ff98] focus:shadow-[0_0_20px_-5px_rgba(152,255,152,0.4)] transition-all shadow-inner appearance-none cursor-pointer"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang} className="bg-black text-[#98ff98]">{lang}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-serif italic text-white tracking-widest pl-1 drop-shadow-md">Question Quantity</label>
                    <div className="relative w-full">
                      <input 
                        type="number" min="1" 
                        value={ritualConfig.quantity === 0 ? '' : ritualConfig.quantity} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRitualConfig(p => ({...p, quantity: isNaN(val) ? 0 : Math.max(1, val)}));
                        }} 
                        className="w-full bg-[#030a06] border border-emerald-900/50 rounded-xl py-4 px-5 text-[#98ff98] font-serif hover:border-emerald-500/80 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all shadow-inner"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-700 font-serif italic uppercase text-xs tracking-widest pointer-events-none">[ Spells ]</span>
                    </div>
                  </div>

                  {/* Threshold */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end pl-1">
                      <label className="text-sm font-serif italic text-white tracking-widest drop-shadow-md">Arcane Threshold</label>
                      <span className="text-sm font-serif italic text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{ritualConfig.threshold}% Target Accuracy</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 w-full mt-1">
                      {PRESETS.map((preset) => (
                        <button 
                           key={preset.id}
                           onClick={() => {
                             setRitualConfig(p => ({ 
                               ...p, 
                               difficulty: preset.id, 
                               threshold: preset.value !== null ? preset.value : p.threshold 
                             }));
                           }}
                           className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all border font-serif ${ritualConfig.difficulty === preset.id ? 'bg-emerald-900/40 border-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]' : 'bg-black/60 border-[#1a3322] hover:bg-[#0a1a10]'}`}
                        >
                           <span className={`text-[10px] font-bold uppercase tracking-wider ${ritualConfig.difficulty === preset.id ? 'text-emerald-200' : 'text-emerald-700'}`}>{preset.label}</span>
                           {preset.value !== null && <span className={`text-xs font-black mt-1 ${ritualConfig.difficulty === preset.id ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' : 'text-zinc-600'}`}>{preset.value}%</span>}
                        </button>
                      ))}
                    </div>
                    <div className={`transition-opacity duration-300 ${ritualConfig.difficulty === 'custom' ? 'opacity-100 mt-4' : 'opacity-50 pointer-events-none'}`}>
                        <input 
                           type="range" min="0" max="100" step="1" 
                           value={ritualConfig.threshold} 
                           onChange={(e) => setRitualConfig(p => ({...p, threshold: parseInt(e.target.value)}))} 
                           className="w-full accent-[#ff7f50] drop-shadow-[0_0_10px_rgba(255,127,80,0.8)] h-1 bg-[#1a3322] rounded-lg appearance-none cursor-pointer" 
                        />
                    </div>
                  </div>
                </div>

                {/* Upload & Gamify Buttons */}
                <div className="flex flex-col items-center gap-6 p-8 bg-[#030a06]/80 rounded-3xl border border-emerald-900/30 hover:bg-[#07170a]/90 transition-all backdrop-blur-sm w-full">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || ritualConfig.quantity < 1 || cooldownSeconds > 0}
                    className="group disabled:opacity-50 relative flex items-center justify-center gap-4 px-12 py-6 bg-gradient-to-b from-emerald-900 to-emerald-950 hover:from-[#ff7f50]/40 hover:to-emerald-900 active:from-black active:to-black rounded-full border border-emerald-500/50 hover:border-[#ffcba4]/80 text-emerald-100 hover:text-[#ffcba4] uppercase tracking-[0.3em] font-black transition-all duration-500 shadow-[0_0_40px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,127,80,0.6)] overflow-hidden w-full cursor-pointer font-serif"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffcba4]/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                    <Flame className={`w-8 h-8 text-emerald-400 ${uploading ? 'animate-pulse text-[#ff7f50]' : 'group-hover:text-[#ffcba4] transition-colors duration-500'}`} />
                    <span className="text-md">{uploading ? "Forging..." : cooldownSeconds > 0 ? "Gathering Arcane Energy..." : "Ignite the Fire"}</span>
                    {!cooldownSeconds && !uploading && <Upload className={`w-6 h-6 text-emerald-500 group-hover:-translate-y-1 group-hover:text-[#ffcba4] transition-all`} />}
                  </button>

                  <button onClick={() => setForgeMode('SELECT')} className="text-emerald-700 hover:text-emerald-400 font-serif uppercase tracking-widest text-xs transition-colors py-2">[ Cancel Ritual ]</button>
                  
                  <p className="text-[#a7f3d0] font-serif italic text-sm tracking-widest text-center max-w-md drop-shadow-md mt-2">
                    {uploading ? `Forging ${ritualConfig.quantity} ${ritualConfig.targetLanguage.split('—')[0].trim()} spells...` : "Offer Grimoires (PDFs) to forge new Spell Cards and ignite the arena."}
                  </p>
                  <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleUpload}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Unified HUD */}
      <div className="fixed bottom-0 left-0 w-full h-[180px] bg-[#020503]/95 backdrop-blur-xl border-t border-[#1a3322] flex z-50 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.9)]">
        
        {/* Left Side: Battle Log */}
        <div className="w-1/2 h-full p-6 border-r border-[#1a3322] flex flex-col gap-3 overflow-hidden">
          <h4 className={`text-emerald-400 font-serif italic uppercase tracking-widest text-xs flex items-center gap-2 drop-shadow-[0_0_5px_rgba(16,185,129,0.6)] transition-colors`}>
            <BookOpen size={14} className="text-[#ff7f50]"/> Battle Log Archive
          </h4>
          <AnimatePresence>
            <div className="flex flex-col gap-2 font-serif text-sm opacity-90 drop-shadow-md overflow-y-auto">
              {battleLog.map((log, index) => (
                <motion.div key={log + index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: index === 0 ? 1 : 0.6, x: 0, scale: index === 0 ? 1 : 0.98 }} className={`flex items-center gap-2 ${index === 0 ? 'text-white font-bold' : 'text-emerald-900'}`}>
                  {index === 0 && <span className="text-emerald-400">»</span>}
                  <span className={log.includes("Fizzle") || log.includes("interrupted") || log.includes("Block") ? "text-[#ff7f50]" : log.includes("Vanquished") || log.includes("effective") || log.includes("correct") ? "text-[#98ff98]" : "text-[#a7f3d0]"}>{log}</span>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>

        {/* Right Side: Spell Hand */}
        <div className="w-1/2 h-full p-6 flex flex-col gap-3">
          <h4 className="text-cyan-400 font-serif uppercase tracking-widest text-xs flex items-center gap-2 italic">
            <Zap size={14} className="text-cyan-300" /> Active Spell Cards
          </h4>
          <div className="flex-1 flex items-center justify-start gap-4 overflow-x-auto pb-2">
            <AnimatePresence>
              {boss?.status === 'battle_active' && boss.playerHand && boss.playerHand.map((spellToken: string, handIndex: number) => (
                <motion.button
                  key={`${handIndex}-${spellToken}`}
                  initial={{ y: 50, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  onClick={() => handleCastSpell(handIndex)}
                  className="flex-shrink-0 relative w-[90px] h-[110px] bg-[#050f0a] border-2 border-emerald-500/50 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center p-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] group overflow-hidden transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent pointer-events-none" />
                  <span className="text-sm font-black text-emerald-200 z-10 text-center uppercase tracking-wider">{spellToken}</span>
                  <span className="text-[9px] text-[#ffcba4] mt-2 z-10 uppercase tracking-widest font-bold text-center border-t border-emerald-500/30 pt-1 w-full">Cast</span>
                </motion.button>
              ))}
              {boss?.status === 'battle_active' && (!boss.playerHand || boss.playerHand.length === 0) && (
                <div className="w-full h-full flex flex-col items-center justify-center text-emerald-900 font-serif text-sm border-2 border-dashed border-[#1a3322] rounded-xl italic">
                  Answer correctly to draw spell cards.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
