"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc, addDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import LandingPageComponent from "./LandingPageComponent";
import BattleModeComponent from "./BattleModeComponent";
import { ShieldAlert, BookOpen, Zap, Droplet } from "lucide-react";

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
  { id: 'legendary', label: 'Legendary', value: 95 }
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

  if (loading) return <div className="text-zinc-500 font-normal animate-pulse text-center p-10 bg-black/40 rounded-3xl border border-emerald-900/30">Consulting the ancient archives...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-10 p-12 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-emerald-900/40 shadow-2xl overflow-hidden relative">
      <h3 className="text-4xl font-bold tracking-[0.3em] text-emerald-400 uppercase text-center flex items-center justify-center gap-6">
         HALL OF RECORDS
      </h3>
      {statsArray.length === 0 ? (
        <p className="text-center text-emerald-900 font-normal italic text-lg py-12">No raids have been archived in this cycle. Return to the Forge.</p>
      ) : (
        <div className="flex flex-col gap-10 w-full">
          {statsArray.map((stat, i) => (
            <div key={i} className="flex flex-col gap-4 relative group">
              <div className="flex justify-between items-end border-b border-emerald-900/40 pb-2">
                <span className="text-emerald-100 font-bold tracking-widest uppercase text-xl group-hover:text-emerald-300 transition-colors">{stat.subject}</span>
                <div className="flex gap-8 text-xs font-normal italic uppercase text-emerald-800">
                  <span>Mastery: <span className="text-emerald-400 font-bold">{stat.totalMastery}</span></span>
                  <span>Accuracy: <span className="text-emerald-400 font-bold">{Math.round(stat.avgAccuracy * 100)}%</span></span>
                  <span>Raids: {stat.raids}</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-emerald-950">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stat.avgAccuracy * 100}%` }} transition={{ duration: 1.5, delay: i * 0.1, type: "spring" }} className="h-full bg-gradient-to-r from-emerald-900 to-emerald-400 relative">
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-white/20 blur-md" />
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
  
  // Game State Hooks (Isolation Protocol)
  const [viewState, setViewState] = useState<'LANDING' | 'BATTLE'>('LANDING');

  // POV Battle State
  const [battlePhase, setBattlePhase] = useState<'QUESTIONING' | 'BATTLING' | 'FAILED' | 'VICTORY'>('QUESTIONING');
  const [currentSpellIndex, setCurrentSpellIndex] = useState(0);
  const [wizardHP, setWizardHP] = useState(100);
  const [goblinHP, setGoblinHP] = useState(100);
  const [maxGoblinHP, setMaxGoblinHP] = useState(100);
  const [damagePerHit, setDamagePerHit] = useState(20);
  const [playerDamagePerMiss, setPlayerDamagePerMiss] = useState(25);
  const [lastAction, setLastAction] = useState<'CORRECT' | 'INCORRECT' | null>(null);
  
  // Tactical RPG State (Status Effects)
  const [enemyStatuses, setEnemyStatuses] = useState<{ type: 'BURN' | 'ICE' | 'DARK', duration: number }[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<{ type: 'GRASS', duration: number }[]>([]);
  const [playerHand, setPlayerHand] = useState<string[]>([]);

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
  const [isLogVisible, setIsLogVisible] = useState(true);

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
            
            // --- Arcane Threshold Math Engine ---
            const totalQuestions = data.spells?.length || ritualConfig.quantity || 1;
            const thresholdPercent = data.threshold || ritualConfig.threshold || 75;
            const hitsNeededToWin = Math.ceil(totalQuestions * (thresholdPercent / 100));
            const calcDamagePerHit = 100 / hitsNeededToWin;
            
            const maxAllowableMisses = totalQuestions - hitsNeededToWin;
            const calcDamagePerMiss = 100 / (maxAllowableMisses + 1);

            setWizardHP(100);
            setGoblinHP(100);
            setMaxGoblinHP(100);
            setDamagePerHit(calcDamagePerHit);
            setPlayerDamagePerMiss(calcDamagePerMiss);
            setEnemyStatuses([]);
            setPlayerStatuses([]);
            setPlayerHand([]);
            setIsLogVisible(true); // Mandatory visibility for battle HUD

            setLastAction(null);
            setViewState('BATTLE'); // Transition to Battle Mode
            if (data.spells && Array.isArray(data.spells)) {
                data.spells = [...data.spells].sort(() => Math.random() - 0.5);
            }
        }
        if (data.status === 'idle' && boss.status === 'battle_active') {
            setViewState('LANDING'); // Transition back to Landing after battle
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

  // Watcher for Wizard Death (Immediate Trigger)
  useEffect(() => {
    if (wizardHP <= 0 && viewState === 'BATTLE' && battlePhase === 'QUESTIONING') {
      setBattlePhase('FAILED');
    }
  }, [wizardHP, viewState, battlePhase]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Cooldown timer
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
        setBattleLog([`The Grimoire revealed secrets! Battle begins!`, ...battleLog].slice(0, 6));
        // Firebase snapshot will trigger setViewState('BATTLE')
      } else if (res.status === 429) {
        setToastMessage(data.error);
        setCooldownSeconds(data.retryDelay || 60);
      } else {
        setToastMessage("Upload Failed: " + (data.details || data.error));
      }
    } catch (error) {
      console.error(error);
      setToastMessage("A disruption in the aether occurred.");
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
        setBattleLog([isWin ? `Boss Vanquished! Accuracy: ${Math.round(accuracy * 100)}%` : `Spell Fizzle! Accuracy: ${Math.round(accuracy * 100)}%.`]);
      }, 2000);
    } catch(err) {
      console.error("Failed to archive raid", err);
    }
  };

  const handleAttack = async (spell: any, selectedOption: string) => {
    if (!boss || isFinalizing || battlePhase !== 'QUESTIONING') return;
    
    setBattlePhase('BATTLING');
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
        const newLog = `[${data.spellCast || 'Evaded'}] ${data.message} ${isCorrect ? `(+${difficultyVal * 100} Mastery)` : ''}`;
        setBattleLog(prev => [newLog, ...prev].slice(0, 6));
        
        // --- Unified Tactical Combat Logic (Round Resolution) ---
        let finalDamageToEnemy = 0;
        let finalDamageToPlayer = 0;

        // 1. Resolve Pre-Action Buffs (ICE / GRASS)
        const hasIceDebuff = enemyStatuses.find(s => s.type === 'ICE');
        const hasGrassBuff = playerStatuses.find(s => s.type === 'GRASS');
        const hasDarkDebuff = enemyStatuses.find(s => s.type === 'DARK');

        if (isCorrect) {
          // --- HAND ACQUISITION PHASE ---
          // Correct answers no longer deal damage. They just grant a spell card.
          const spellMap: Record<string, string> = { 'A': 'FIRE', 'B': 'ICE', 'C': 'HOLY', 'D': 'DARK' };
          const chosenSpell = spellMap[selectedOption] || 'GRASS';
          
          setPlayerHand(prev => [...prev, chosenSpell]);
          setBattleLog(prev => [`📜 Gained [${chosenSpell}] Card! Cast it from your hand.`, ...prev].slice(0, 6));

        } else {
          // --- Enemy Counter-Attack Phase ---
          try { new Audio('/fahhh.mp3').play(); } catch(e) {}
          let playerDamageMultiplier = 1.0;
          if (hasDarkDebuff) {
             playerDamageMultiplier *= 0.5;
             setEnemyStatuses(prev => prev.filter(s => s.type !== 'DARK'));
             setBattleLog(prev => [`🌑 Enemy attack weakened by Dark!`, ...prev].slice(0, 6));
          }
          finalDamageToPlayer = playerDamagePerMiss * playerDamageMultiplier;
          setWizardHP(prev => Math.max(0, prev - finalDamageToPlayer));
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
          setBattleLog(prev => [`⚠️ DISRUPTION! Took ${Math.round(finalDamageToPlayer)} damage.`, ...prev].slice(0, 6));
        }

        // Domain Effects (DoT - BURN) still resolve at end of "answer round"
        const burnStatus = enemyStatuses.find(s => s.type === 'BURN');
        if (burnStatus) {
           setGoblinHP(prev => Math.max(0, prev - 5)); 
           setEnemyStatuses(prev => prev.map(s => s.type === 'BURN' ? { ...s, duration: s.duration - 1 } : s).filter(s => s.duration > 0));
           setBattleLog(prev => [`♨️ Burn resolved (-5 HP).`, ...prev].slice(0, 6));
        }
      }
    } catch (err) {
      console.error("Failed to commit attack", err);
    }

    setTimeout(async () => {
       if (wizardHP <= 0) {
          setBattlePhase('FAILED');
          try { await setDoc(doc(db, "gameData", "boss"), { hp: boss.maxHp }, { merge: true }); } catch (err) {}
       } else if (goblinHP <= 0 || ((newAnswered >= (boss.spells?.length || ritualConfig.quantity)) && (!boss.playerHand || boss.playerHand.length === 0))) {
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
    const chosenSpell = playerHand[index];
    if (!chosenSpell || isFinalizing) return;
    
    // --- TACTICAL SPELL EXECUTION ---
    let damageMultiplier = 1.0;
    const hasIceDebuff = enemyStatuses.find(s => s.type === 'ICE');
    const hasGrassBuff = playerStatuses.find(s => s.type === 'GRASS');

    if (hasIceDebuff) damageMultiplier *= 1.5;
    if (hasGrassBuff) damageMultiplier *= 1.5;

    const finalDamage = damagePerHit * damageMultiplier;
    
    // Apply Damage
    setGoblinHP(prev => Math.max(0, prev - finalDamage));
    
    // Consume Hand Card
    setPlayerHand(prev => prev.filter((_, i) => i !== index));

    // Consume Buffs
    if (hasIceDebuff) setEnemyStatuses(prev => prev.filter(s => s.type !== 'ICE'));
    if (hasGrassBuff) setPlayerStatuses(prev => prev.filter(s => s.type !== 'GRASS'));

    // Apply Effects
    if (chosenSpell === 'FIRE') {
       setEnemyStatuses(prev => [...prev, { type: 'BURN', duration: 3 }]);
       setBattleLog(prev => [`💥 [FIRE] Deals dmg + Burn DoT!`, ...prev].slice(0, 6));
    } else if (chosenSpell === 'ICE') {
       setEnemyStatuses(prev => [...prev.filter(s => s.type !== 'ICE'), { type: 'ICE', duration: 1 }]);
       setBattleLog(prev => [`💥 [ICE] Deals dmg + Shards enemy!`, ...prev].slice(0, 6));
    } else if (chosenSpell === 'HOLY') {
       setWizardHP(prev => Math.min(100, prev + 25)); // HEAL PLAYER ONLY
       setBattleLog(prev => [`✨ [HOLY] Deals dmg + HEALS WIZARD!`, ...prev].slice(0, 6));
    } else if (chosenSpell === 'DARK') {
       setEnemyStatuses(prev => [...prev.filter(s => s.type !== 'DARK'), { type: 'DARK', duration: 1 }]);
       setBattleLog(prev => [`💥 [DARK] Deals dmg + Enfeebles enemy!`, ...prev].slice(0, 6));
    } else {
       setPlayerStatuses(prev => [...prev.filter(s => s.type !== 'GRASS'), { type: 'GRASS', duration: 1 }]);
       setBattleLog(prev => [`🌿 [GRASS] Deals dmg + Empowers you!`, ...prev].slice(0, 6));
    }

    setIsLightning(true);
    setBattlePhase('BATTLING');
    setLastAction('CORRECT');
    
    setTimeout(() => { 
       setIsLightning(false); 
       setBattlePhase('QUESTIONING'); 
       setLastAction(null);
       
       if (goblinHP - finalDamage <= 0) {
          setBattlePhase('VICTORY');
          finalizeRaid(raidStats.answered, raidStats.correct, raidStats.mastery);
       }
    }, 800);
  };

  const handleRetryBattle = () => {
     setBattlePhase('QUESTIONING');
     setCurrentSpellIndex(0);
     
     // Recalculate dynamic HP on retry
     const totalQuestions = boss.spells?.length || ritualConfig.quantity || 1;
     const thresholdPercent = boss.threshold || ritualConfig.threshold || 75;
     const hitsNeededToWin = Math.ceil(totalQuestions * (thresholdPercent / 100));
     const calcDamagePerHit = 100 / hitsNeededToWin;
     const maxAllowableMisses = totalQuestions - hitsNeededToWin;
     const calcDamagePerMiss = 100 / (maxAllowableMisses + 1);

     setWizardHP(100);
     setGoblinHP(100);
     setMaxGoblinHP(100);
     setDamagePerHit(calcDamagePerHit);
     setPlayerDamagePerMiss(calcDamagePerMiss);
     setEnemyStatuses([]);
     setPlayerStatuses([]);
     setPlayerHand([]);
     setIsLogVisible(true);

     setLastAction(null);
     setRaidStats({ startTime: Date.now(), answered: 0, correct: 0, mastery: 0 });
     if (boss.spells && Array.isArray(boss.spells)) {
         const shuffled = [...boss.spells].sort(() => Math.random() - 0.5);
         setBoss({...boss, spells: shuffled});
     }
  };

  const handleReturnToMenu = async () => {
     try {
       await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [] }, { merge: true });
       setViewState('LANDING'); // Force return to landing
     } catch(err) {}
  };

  const handleRetreat = async () => {
    setShowRetreatModal(false);
    setViewState('LANDING'); // ISOATION: Switch view immediately 
    setBattleLog(["Retreated to the Nexus.", ...battleLog].slice(0, 6));
    try {
      await setDoc(doc(db, "gameData", "boss"), { status: 'idle', spells: [], hp: 100, maxHp: 100, enemyHp: 100, playerHp: 100 }, { merge: true });
    } catch(err) {}
  };

  const theme = getTheme(boss.subject);

  return (
    <div className={`w-screen bg-black text-slate-200 font-sans flex flex-col ${viewState === 'BATTLE' ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'} relative selection:bg-emerald-900 selection:text-white ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* Universal Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-red-950/80 border border-red-500 p-6 rounded-3xl backdrop-blur-xl max-w-xl w-[90%] shadow-2xl">
            <div className="flex items-center gap-4">
               <ShieldAlert className="text-red-400 w-8 h-8" />
               <div className="flex flex-col">
                  <span className="text-red-100 font-bold uppercase tracking-widest text-lg">Disruption</span>
                  <p className="text-red-300 font-normal italic text-sm">{toastMessage}</p>
               </div>
               <button onClick={() => setToastMessage(null)} className="ml-auto text-red-500 hover:text-white text-xl p-2">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Condition Rendering Logic (Prevent Scroll-back) */}
      <div className={`flex-1 flex flex-col relative ${viewState === 'BATTLE' ? 'overflow-hidden h-full' : ''}`}>
         <AnimatePresence mode="wait">
            {viewState === 'LANDING' ? (
              <motion.div 
                key="landing-page" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="w-full"
              >
                <LandingPageComponent 
                   currentView={currentView}
                   setCurrentView={setCurrentView}
                   forgeMode={forgeMode}
                   setForgeMode={setForgeMode}
                   ritualConfig={ritualConfig}
                   setRitualConfig={setRitualConfig}
                   handleUpload={handleUpload}
                   uploading={uploading}
                   cooldownSeconds={cooldownSeconds}
                   fileInputRef={fileInputRef}
                   PRESETS={PRESETS}
                   LANGUAGES={LANGUAGES}
                   AnalyticsView={<AnalyticsView />}
                />
              </motion.div>
            ) : (
              <motion.div 
                 key="battle-mode" 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                 className="w-full flex-1 flex flex-col relative overflow-hidden"
              >
                  {/* Global Battle Exit (Top-Level) */}
                  <div className="absolute top-6 right-6 z-[250]">
                     <button 
                        onClick={handleRetreat} 
                        className="flex items-center gap-2 px-6 py-3 bg-red-950/80 text-red-100 hover:bg-red-600 hover:text-white rounded-full border border-red-500/50 transition-all font-bold tracking-widest uppercase text-xs shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-xl group hover:scale-110 active:scale-95 pointer-events-auto"
                     >
                        <ShieldAlert size={14} className="group-hover:rotate-12 transition-transform" /> 
                        QUIT RITUAL
                     </button>
                  </div>

                 <div className="flex-1 relative overflow-hidden">
                    <BattleModeComponent 
                       boss={boss}
                       wizardHP={wizardHP}
                       goblinHP={goblinHP}
                       maxGoblinHP={maxGoblinHP}
                       enemyStatuses={enemyStatuses}
                       playerStatuses={playerStatuses}
                       battlePhase={battlePhase}
                       currentSpellIndex={currentSpellIndex}
                       lastAction={lastAction}
                       onAttack={handleAttack}
                       onCastSpell={handleCastSpell}
                       onRetry={handleRetryBattle}
                       onReturnToMenu={handleReturnToMenu}
                       onRetreat={handleRetreat}
                       isShaking={isShaking}
                       isLightning={isLightning}
                       theme={theme}
                       ritualConfigQuantity={ritualConfig.quantity}
                    />
                 </div>

                 {/* Persistent Battle HUD Tabs */}
                 <motion.div 
                   key="persistent-battle-hud"
                      initial={{ y: 200 }} animate={{ y: 0 }} 
                      className="w-full h-[200px] flex bg-[#020503]/95 backdrop-blur-3xl border-t border-emerald-950/40 z-[150] shadow-2xl shrink-0"
                    >
                       <div className="w-1/2 h-full p-6 border-r border-emerald-950/40 flex flex-col gap-3 overflow-hidden">
                          <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 italic">
                             <BookOpen size={14} className="text-[#ff7f50]"/> Battle Log Archive
                          </h4>
                          <div className="flex flex-col gap-2 font-normal text-sm overflow-y-auto">
                             {battleLog.map((log, index) => (
                               <div key={index} className={`flex items-center gap-2 ${index === 0 ? 'text-white font-bold' : 'text-emerald-900 opacity-60'}`}>
                                  {index === 0 && <span className="text-emerald-400">»</span>}
                                  <span className={log.includes("Vanquished") ? "text-[#98ff98]" : log.includes("Fizzle") ? "text-[#ff7f50]" : "text-[#a7f3d0]"}>{log}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="w-1/2 h-full p-6 flex flex-col gap-3">
                          <h4 className="text-cyan-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 italic">
                             <Zap size={14} className="text-cyan-300" /> Active Spell Cards
                          </h4>
                          <div className="flex-1 flex items-center justify-start gap-4 overflow-x-auto pb-2">
                             {playerHand.map((spellToken: string, index: number) => (
                                <motion.button key={index} whileHover={{ y: -10 }} onClick={() => handleCastSpell(index)} className="flex-shrink-0 w-24 h-28 bg-[#050f0a] border-2 border-emerald-500/50 rounded-xl flex flex-col items-center justify-center p-2 shadow-lg">
                                   <span className="text-xs font-black text-emerald-200 text-center uppercase tracking-wider">{spellToken}</span>
                                </motion.button>
                             ))}
                             {playerHand.length === 0 && (
                                <div className="w-full h-full flex items-center justify-center text-emerald-900 font-normal italic text-sm border-2 border-dashed border-emerald-950/40 rounded-xl">Draw cards by answering.</div>
                             )}
                          </div>
                       </div>
                    </motion.div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>


    </div>
  );
}
