"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Loader2, Trophy, Flame, Zap, Star, Target, Award, BookOpen, LogOut,
  CheckCircle2, XCircle, ChevronRight, Home, Brain, Crown, Medal,
  Calendar, TrendingUp, Clock, Sparkles, RefreshCw, AlertTriangle, Lightbulb,
  User as UserIcon, Pencil, X, Mail, Phone, Hash, Shield, Save
} from "lucide-react";

type View = "home" | "practice-list" | "practice-play" | "mock-list" | "mock-play" | "mock-result" | "leaderboard" | "badges" | "history" | "profile";

export function StudentApp({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [view, setView] = useState<View>("home");
  const [dash, setDash] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [selectedMock, setSelectedMock] = useState<any>(null);
  const [mockResult, setMockResult] = useState<any>(null);

  const loadDash = useCallback(async () => {
    setLoadingDash(true);
    try {
      const res = await fetch("/api/student/dashboard");
      const data = await res.json();
      if (res.ok) setDash(data);
    } finally {
      setLoadingDash(false);
    }
  }, []);

  useEffect(() => { loadDash(); }, [loadDash]);

  // Heartbeat: log activity every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/student/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", details: "active_session", durationSec: 60 }),
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  const navItems: { key: View; label: string; icon: any; color: string }[] = [
    { key: "home", label: "Home", icon: Home, color: "from-purple-500 to-pink-500" },
    { key: "practice-list", label: "Practice", icon: Brain, color: "from-blue-500 to-cyan-500" },
    { key: "mock-list", label: "Mock Tests", icon: Target, color: "from-amber-500 to-orange-500" },
    { key: "leaderboard", label: "Leaderboard", icon: Crown, color: "from-yellow-500 to-amber-500" },
    { key: "badges", label: "Badges", icon: Award, color: "from-green-500 to-emerald-500" },
    { key: "history", label: "History", icon: Clock, color: "from-violet-500 to-purple-500" },
    { key: "profile", label: "Profile", icon: UserIcon, color: "from-pink-500 to-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center text-xl cq-glow shrink-0">⚖️</div>
            <div className="min-w-0">
              <div className="font-black text-base sm:text-lg leading-tight bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-[10px] sm:text-xs text-white/50 leading-tight truncate">{user.college?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {dash && <UserStatPills dash={dash} />}
            <button onClick={handleLogout} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Nav (horizontal on mobile, sidebar on desktop) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-2">
        <nav className="flex gap-2 overflow-x-auto cq-scroll pb-2 md:grid md:grid-cols-6 md:gap-2 md:overflow-visible">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = view === item.key || (item.key === "practice-list" && (view === "practice-play")) || (item.key === "mock-list" && (view === "mock-play" || view === "mock-result"));
            return (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setSelectedWeek(null); setSelectedMock(null); setMockResult(null); }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-20 pt-4">
        {loadingDash && view === "home" ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {view === "home" && dash && <HomeView dash={dash} onPractice={() => setView("practice-list")} onMock={() => setView("mock-list")} onLeaderboard={() => setView("leaderboard")} />}
              {view === "practice-list" && (
                <PracticeListView dash={dash} onSelectWeek={(w) => { setSelectedWeek(w); setView("practice-play"); }} />
              )}
              {view === "practice-play" && selectedWeek && (
                <PracticePlayView week={selectedWeek} onExit={() => { setView("practice-list"); loadDash(); }} onLevelUp={() => loadDash()} />
              )}
              {view === "mock-list" && (
                <MockListView dash={dash} onSelectMock={(m) => { setSelectedMock(m); setView("mock-play"); }} />
              )}
              {view === "mock-play" && selectedMock && (
                <MockPlayView mockTest={selectedMock} onComplete={(r) => { setMockResult(r); setView("mock-result"); loadDash(); }} onExit={() => setView("mock-list")} />
              )}
              {view === "mock-result" && mockResult && (
                <MockResultView result={mockResult} onExit={() => { setView("mock-list"); setMockResult(null); }} onHome={() => { setView("home"); setMockResult(null); }} />
              )}
              {view === "leaderboard" && <LeaderboardView user={user} />}
              {view === "badges" && dash && <BadgesView dash={dash} />}
              {view === "history" && dash && <HistoryView dash={dash} />}
              {view === "profile" && <ProfileView user={user} onUpdated={loadDash} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="text-center py-4 text-[11px] text-white/30 border-t border-white/5">
        Constitution Quest • Gamified Learning Platform • IES College of Engineering
      </footer>
    </div>
  );
}

function UserStatPills({ dash }: { dash: any }) {
  const stats = [
    { icon: Zap, value: dash.user.xp, label: "XP", color: "text-amber-300" },
    { icon: Star, value: dash.user.level, label: "Lvl", color: "text-purple-300" },
    { icon: Flame, value: dash.user.streak, label: "Day", color: "text-orange-300" },
  ];
  return (
    <div className="hidden sm:flex items-center gap-2">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-xs font-bold">{s.value}</span>
            <span className="text-[10px] text-white/40">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============== HOME ==============
function HomeView({ dash, onPractice, onMock, onLeaderboard }: any) {
  const u = dash.user;
  const accuracy = dash.stats.accuracy;
  const xpPct = Math.min(100, ((u.xp - xpForLevel(u.level)) / Math.max(1, xpForLevel(u.level + 1) - xpForLevel(u.level))) * 100);

  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-amber-600/20 border border-purple-400/30 p-6 sm:p-8"
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-purple-500/20 blur-2xl" />
        <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-pink-500/20 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-purple-300 font-bold mb-2">Welcome back, hero!</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-1 cq-text-glow">{u.name}</h2>
            <p className="text-white/60 text-sm mb-4">
              {u.department?.name} • {u.college?.name}
              {u.mentor && <span className="block mt-0.5">Mentor: {u.mentor}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={onPractice} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-sm flex items-center gap-2 hover:scale-105 transition">
                <Brain className="w-4 h-4" /> Practice
              </button>
              <button onClick={onMock} className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm flex items-center gap-2 hover:scale-105 transition">
                <Target className="w-4 h-4" /> Take Mock Test
              </button>
              <button onClick={onLeaderboard} className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition">
                <Crown className="w-4 h-4" /> Leaderboard
              </button>
            </div>
          </div>
          {/* Level orb */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="44" fill="none" stroke="url(#gradLevel)" strokeWidth="8" strokeLinecap="round"
                    initial={{ strokeDashoffset: 277 }}
                    animate={{ strokeDashoffset: 277 - (277 * xpPct / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeDasharray="277"
                  />
                  <defs>
                    <linearGradient id="gradLevel" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">Level</div>
                  <div className="text-3xl font-black bg-gradient-to-br from-purple-300 to-amber-300 bg-clip-text text-transparent">{u.level}</div>
                </div>
              </div>
              <div className="text-[11px] text-white/50 mt-2">{u.xp} XP</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Brain} label="Practice" value={dash.stats.totalPractice} color="from-blue-500/20 to-cyan-500/20" iconColor="text-cyan-300" />
        <StatCard icon={Target} label="Mock Tests" value={dash.stats.mockCount} color="from-amber-500/20 to-orange-500/20" iconColor="text-amber-300" />
        <StatCard icon={CheckCircle2} label="Accuracy" value={`${accuracy}%`} color="from-green-500/20 to-emerald-500/20" iconColor="text-emerald-300" />
        <StatCard icon={Award} label="Badges" value={dash.stats.badgeCount} color="from-purple-500/20 to-pink-500/20" iconColor="text-pink-300" />
      </div>

      {/* Streak */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-400/30 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl cq-float">🔥</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-300 font-bold">Current Streak</div>
            <div className="text-3xl font-black">{u.streak} <span className="text-base font-medium text-white/60">days</span></div>
            <div className="text-xs text-white/50 mt-1">Best: {u.longestStreak} days • Stay consistent!</div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[11px] text-white/50">Daily login earns</div>
          <div className="text-lg font-bold text-amber-300">+10 XP</div>
        </div>
      </div>

      {/* Weekly map */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-300" />
          Your Quest Map — 8 Weeks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dash.weeks.map((w: any) => {
            const pct = w.progress.total > 0 ? Math.round((w.progress.attempted / w.progress.total) * 100) : 0;
            const correctPct = w.progress.attempted > 0 ? Math.round((w.progress.correct / w.progress.attempted) * 100) : 0;
            const isComplete = pct === 100;
            return (
              <button
                key={w.id}
                onClick={onPractice}
                className={`text-left rounded-2xl p-4 border transition-all cq-card-hover ${
                  isComplete
                    ? "bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-400/40"
                    : pct > 0
                    ? "bg-gradient-to-br from-purple-500/15 to-pink-500/15 border-purple-400/40"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${
                    isComplete ? "bg-green-500/30 text-green-200" : pct > 0 ? "bg-purple-500/30 text-purple-200" : "bg-white/10 text-white/50"
                  }`}>{w.number}</div>
                  {isComplete && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {pct > 0 && !isComplete && <Zap className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/40 font-bold">Week {w.number}</div>
                <div className="text-sm font-bold mb-2 line-clamp-2">{w.title}</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/50">
                    <span>Progress</span>
                    <span>{w.progress.attempted}/{w.progress.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  {w.progress.attempted > 0 && (
                    <div className="text-[10px] text-white/40">{correctPct}% correct</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent badges */}
      {dash.badges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-pink-300" />
            Recent Badges
          </h3>
          <div className="flex gap-3 overflow-x-auto cq-scroll pb-2">
            {dash.badges.slice(0, 8).map((b: any) => (
              <div key={b.id} className="shrink-0 w-24 rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-4xl mb-1 cq-float" style={{ animationDelay: `${Math.random()}s` }}>{b.icon}</div>
                <div className="text-[10px] font-bold leading-tight">{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, iconColor }: any) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} border border-white/10 p-4`}>
      <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

// ============== PRACTICE LIST ==============
function PracticeListView({ dash, onSelectWeek }: any) {
  return (
    <div>
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
        <Brain className="w-6 h-6 text-cyan-300" /> Practice Arena
      </h2>
      <p className="text-white/60 text-sm mb-6">Pick a week to start practicing. Every correct answer earns XP!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dash.weeks.map((w: any, i: number) => {
          const pct = w.progress.total > 0 ? Math.round((w.progress.attempted / w.progress.total) * 100) : 0;
          return (
            <motion.button
              key={w.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectWeek(w)}
              className="group text-left rounded-3xl p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all cq-card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black cq-glow">
                    {w.number}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-purple-300 font-bold">Week {w.number}</div>
                    <div className="font-bold text-base leading-tight">{w.title}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-purple-300 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-white/60 mb-3 line-clamp-2">{w.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-3 text-white/50">
                  <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {w.totalQuestions} Qs</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {w.mockTestCount} Mock</span>
                </div>
                <div className="text-purple-300 font-bold">{pct}% done</div>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400" style={{ width: `${pct}%` }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============== PRACTICE PLAY ==============
function PracticePlayView({ week, onExit, onLevelUp }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/questions?weekId=${week.id}`);
        const data = await res.json();
        setQuestions(data.questions);
      } finally { setLoading(false); }
    })();
  }, [week.id]);

  const q = questions[idx];

  async function submitAnswer(option: string) {
    if (selected || submitting) return;
    setSelected(option);
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/submit-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, selectedOption: option, timeTakenSec: 0 }),
      });
      const data = await res.json();
      setResult(data);
      if (data.isCorrect) {
        setStreakCount(s => s + 1);
        setSessionStats(s => ({ ...s, correct: s.correct + 1 }));
        // Confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a855f7", "#ec4899", "#f59e0b"],
        });
        toast.success(`+${data.xpAwarded} XP!`, { description: streakCount + 1 >= 3 ? `${streakCount + 1} in a row! 🔥` : undefined });
        if (data.newBadges?.length > 0) {
          for (const b of data.newBadges) {
            toast(`🎉 New Badge: ${b.icon} ${b.name}!`, { description: b.description });
            setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } }), 300);
          }
        }
        if (data.userStats?.level > (q.level || 0)) {
          onLevelUp();
        }
      } else {
        setStreakCount(0);
        setSessionStats(s => ({ ...s, wrong: s.wrong + 1 }));
        toast.error("Not quite right!", { description: "Read the explanation and keep going." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (idx + 1 >= questions.length) {
      onExit();
      toast.success(`Session complete! ${sessionStats.correct}/${questions.length} correct`);
      return;
    }
    setIdx(i => i + 1);
    setSelected(null);
    setResult(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  if (!q) return <div className="text-center py-20 text-white/60">No questions found.</div>;

  const options = [
    { key: "A", text: q.optionA },
    { key: "B", text: q.optionB },
    { key: "C", text: q.optionC },
    { key: "D", text: q.optionD },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-white/60 hover:text-white text-sm flex items-center gap-1">
          ← Back to weeks
        </button>
        <div className="text-sm text-white/60">
          Question <span className="font-bold text-purple-300">{idx + 1}</span> / {questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400"
          animate={{ width: `${((idx + (selected ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Streak indicator */}
      {streakCount >= 2 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-sm font-bold"
        >
          <Flame className="w-4 h-4" /> {streakCount} streak!
        </motion.div>
      )}

      {/* Question card */}
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider text-purple-300 font-bold">Week {week.number}</span>
          {q.topic && <span className="text-xs text-white/50">• {q.topic}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            q.difficulty === "easy" ? "bg-green-500/20 text-green-300" :
            q.difficulty === "medium" ? "bg-amber-500/20 text-amber-300" :
            "bg-red-500/20 text-red-300"
          }`}>{q.difficulty}</span>
          {q.previouslyCorrect && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">✓ solved</span>}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold leading-snug">{q.questionText}</h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {options.map(opt => {
          const isCorrect = result && opt.key === result.correctOption;
          const isWrongPick = result && selected === opt.key && !result.isCorrect;
          return (
            <button
              key={opt.key}
              onClick={() => submitAnswer(opt.key)}
              disabled={!!selected}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                isCorrect ? "bg-emerald-500/20 border-emerald-400 cq-glow-green" :
                isWrongPick ? "bg-red-500/20 border-red-400 cq-shake" :
                selected ? "bg-white/5 border-white/10 opacity-50" :
                "bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-purple-500/10"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                isCorrect ? "bg-emerald-500 text-white" :
                isWrongPick ? "bg-red-500 text-white" :
                "bg-white/10 text-white/70"
              }`}>{opt.key}</div>
              <span className="text-sm sm:text-base flex-1">{opt.text}</span>
              {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWrongPick && <XCircle className="w-5 h-5 text-red-400" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            className="space-y-3 mb-4 overflow-hidden"
          >
            <div className={`rounded-2xl p-5 border ${result.isCorrect ? "bg-emerald-500/10 border-emerald-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
              <div className="flex items-center gap-2 mb-2 font-bold">
                {result.isCorrect ? (
                  <><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Correct! +{result.xpAwarded} XP</>
                ) : (
                  <><Lightbulb className="w-5 h-5 text-amber-400" /> Not quite — but you learned something!</>
                )}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{result.explanation}</p>
            </div>
            {/* Why others wrong */}
            {result.isCorrect && (result.whyWrongA || result.whyWrongB || result.whyWrongC || result.whyWrongD) && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs font-bold text-white/60 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Why the other options are wrong:
                </div>
                <ul className="space-y-1.5 text-sm text-white/70">
                  {result.whyWrongA && <li><span className="font-bold text-red-300">A:</span> {result.whyWrongA}</li>}
                  {result.whyWrongB && <li><span className="font-bold text-red-300">B:</span> {result.whyWrongB}</li>}
                  {result.whyWrongC && <li><span className="font-bold text-red-300">C:</span> {result.whyWrongC}</li>}
                  {result.whyWrongD && <li><span className="font-bold text-red-300">D:</span> {result.whyWrongD}</li>}
                </ul>
              </div>
            )}
            {!result.isCorrect && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs font-bold text-white/60 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-400" /> Why others are wrong:
                </div>
                <ul className="space-y-1.5 text-sm text-white/70">
                  {result.whyWrongA && <li><span className="font-bold text-red-300">A:</span> {result.whyWrongA}</li>}
                  {result.whyWrongB && <li><span className="font-bold text-red-300">B:</span> {result.whyWrongB}</li>}
                  {result.whyWrongC && <li><span className="font-bold text-red-300">C:</span> {result.whyWrongC}</li>}
                  {result.whyWrongD && <li><span className="font-bold text-red-300">D:</span> {result.whyWrongD}</li>}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      {result && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={next}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-base flex items-center justify-center gap-2 hover:scale-[1.01] transition"
        >
          {idx + 1 >= questions.length ? "Finish Session" : "Next Question"} <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}

      {/* Session stats */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/50">
        <span>✓ {sessionStats.correct}</span>
        <span>✗ {sessionStats.wrong}</span>
      </div>
    </div>
  );
}

// ============== MOCK TEST LIST ==============
function MockListView({ dash, onSelectMock }: any) {
  const [mocks, setMocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/mock-tests");
        const data = await res.json();
        setMocks(data.mockTests);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
        <Target className="w-6 h-6 text-amber-300" /> Mock Test Arena
      </h2>
      <p className="text-white/60 text-sm mb-6">Test your knowledge under time pressure. Earn massive XP for perfect scores!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mocks.map((m, i) => {
          const attempted = dash.mockAttempts.find((a: any) => a.title === m.title);
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelectMock(m)}
              className="text-left rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/[0.05] border border-amber-400/30 hover:border-amber-400/60 hover:bg-amber-500/15 transition-all cq-card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${m.weekNumber === null ? "bg-gradient-to-br from-yellow-500 to-amber-600 cq-glow-amber" : "bg-gradient-to-br from-amber-500 to-orange-500"}`}>
                    {m.weekNumber === null ? "🏆" : "🎯"}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                      {m.weekNumber === null ? "Grand Final" : `Week ${m.weekNumber}`}
                    </div>
                    <div className="font-bold text-base">{m.title}</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/60 mb-3">{m.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-3 text-white/50">
                  <span>📝 {m.numQuestions} Qs</span>
                  <span>⏱ {m.durationMin} min</span>
                </div>
                {attempted && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    Best: {attempted.percent}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============== MOCK PLAY ==============
function MockPlayView({ mockTest, onComplete, onExit }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mockTest.durationMin * 60);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/submit-mock?mockTestId=${mockTest.id}`);
        const data = await res.json();
        setQuestions(data.questions);
      } finally { setLoading(false); }
    })();
  }, [mockTest.id]);

  // Timer
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const timeTakenSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await fetch("/api/student/submit-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockTestId: mockTest.id, answers, timeTakenSec }),
      });
      const data = await res.json();
      onComplete(data);
    } finally { setSubmitting(false); }
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeColor = timeLeft < 60 ? "text-red-400" : timeLeft < 180 ? "text-amber-400" : "text-white";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-16 z-30 -mx-3 sm:mx-0 mb-4 px-3 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">{mockTest.title}</div>
            <div className="text-xs text-white/50">Answered: {answeredCount}/{questions.length}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black ${timeColor} flex items-center gap-1`}>
              <Clock className="w-5 h-5" />
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm hover:scale-105 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const sel = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${sel ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"}`}>{i + 1}</div>
                <p className="text-sm sm:text-base font-medium pt-1">{q.questionText}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                {[
                  { k: "A", t: q.optionA },
                  { k: "B", t: q.optionB },
                  { k: "C", t: q.optionC },
                  { k: "D", t: q.optionD },
                ].map(opt => (
                  <button
                    key={opt.k}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.k }))}
                    className={`text-left p-3 rounded-xl border text-sm transition flex items-center gap-2 ${
                      sel === opt.k
                        ? "bg-amber-500/20 border-amber-400 text-white"
                        : "bg-white/5 border-white/10 hover:border-amber-400/40 hover:bg-amber-500/5"
                    }`}
                  >
                    <span className="font-bold w-5 h-5 rounded bg-white/10 flex items-center justify-center text-xs">{opt.k}</span>
                    <span className="flex-1">{opt.t}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final submit */}
      <div className="mt-6 sticky bottom-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 py-3 -mx-3 px-3 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:flex sm:items-center sm:justify-between">
        <div className="text-sm text-white/60 mb-2 sm:mb-0">
          {allAnswered ? "✅ All answered!" : `${questions.length - answeredCount} unanswered`}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>🏁 Submit Test</>}
        </button>
      </div>
    </div>
  );
}

// ============== MOCK RESULT ==============
function MockResultView({ result, onExit, onHome }: any) {
  const { score, total, percent, detail, xpAwarded, newBadges } = result;

  useEffect(() => {
    if (percent >= 80) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    } else if (percent >= 50) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    if (newBadges?.length > 0) {
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } }), 600);
    }
  }, [percent, newBadges]);

  const emoji = percent >= 90 ? "🏆" : percent >= 75 ? "🥇" : percent >= 50 ? "🥈" : percent >= 30 ? "🥉" : "💪";
  const title = percent >= 90 ? "Champion!" : percent >= 75 ? "Excellent!" : percent >= 50 ? "Good Job!" : percent >= 30 ? "Keep Practicing!" : "Try Again!";
  const color = percent >= 75 ? "from-emerald-500 to-green-500" : percent >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-pink-500";

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/15 p-8 text-center mb-6 cq-glow"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-7xl mb-3 cq-float"
        >{emoji}</motion.div>
        <h2 className={`text-4xl font-black mb-2 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{title}</h2>
        <div className="text-2xl font-bold mb-1">{score} / {total}</div>
        <div className="text-3xl font-black mb-4">{percent}%</div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 font-bold text-sm">
          <Zap className="w-4 h-4" /> +{xpAwarded} XP earned
        </div>
        {newBadges?.length > 0 && (
          <div className="mt-4 space-y-2">
            {newBadges.map((b: any) => (
              <motion.div
                key={b.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 font-bold text-sm"
              >
                🎉 New Badge: {b.icon} {b.name}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Detailed review */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Detailed Review</h3>
        {detail.map((d: any, i: number) => (
          <div key={d.questionId} className={`rounded-2xl p-4 border ${d.isCorrect ? "bg-emerald-500/5 border-emerald-400/20" : "bg-red-500/5 border-red-400/20"}`}>
            <div className="flex items-start gap-2 mb-3">
              <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${d.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>{i + 1}</span>
              <p className="text-sm font-medium flex-1">{d.questionText}</p>
              {d.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-8 mb-2 text-xs">
              {[
                { k: "A", t: d.optionA }, { k: "B", t: d.optionB }, { k: "C", t: d.optionC }, { k: "D", t: d.optionD },
              ].map(opt => {
                const correct = opt.k === d.correctOption;
                const chosen = opt.k === d.selectedOption;
                return (
                  <div key={opt.k} className={`flex items-center gap-2 p-2 rounded ${correct ? "bg-emerald-500/20" : chosen ? "bg-red-500/20" : "bg-white/5"}`}>
                    <span className="font-bold w-4">{opt.k}</span>
                    <span className="flex-1">{opt.t}</span>
                    {correct && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {chosen && !correct && <XCircle className="w-3 h-3 text-red-400" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-white/70 ml-8"><span className="font-bold text-amber-300">Explanation:</span> {d.explanation}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onExit} className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 font-bold hover:bg-white/15 transition">
          Back to Mock Tests
        </button>
        <button onClick={onHome} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold hover:scale-[1.02] transition">
          Go Home
        </button>
      </div>
    </div>
  );
}

// ============== LEADERBOARD ==============
function LeaderboardView({ user }: any) {
  const [scope, setScope] = useState<"college" | "global">("college");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/leaderboard?scope=${scope}`);
        const d = await res.json();
        setData(d);
      } finally { setLoading(false); }
    })();
  }, [scope]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" /> Leaderboard
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setScope("college")} className={`px-4 py-2 rounded-xl text-sm font-bold ${scope === "college" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10 border border-white/10"}`}>
            My College
          </button>
          <button onClick={() => setScope("global")} className={`px-4 py-2 rounded-xl text-sm font-bold ${scope === "global" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/10 border border-white/10"}`}>
            All Colleges
          </button>
        </div>
      </div>

      {data?.myRank && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-300 font-bold uppercase">Your Rank</div>
            <div className="text-3xl font-black">#{data.myRank}</div>
          </div>
          <Trophy className="w-12 h-12 text-amber-300" />
        </div>
      )}

      <div className="space-y-2">
        {data?.leaderboard.map((u: any, i: number) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`rounded-2xl p-4 border flex items-center gap-3 ${
              u.isCurrentUser
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 cq-glow"
                : i === 0 ? "bg-amber-500/10 border-amber-400/30"
                : i === 1 ? "bg-slate-400/10 border-slate-300/30"
                : i === 2 ? "bg-orange-700/10 border-orange-600/30"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-slate-900" : i === 2 ? "bg-orange-700 text-white" : "bg-white/10 text-white/70"
            }`}>
              {u.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate flex items-center gap-2">
                {u.name}
                {u.isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">YOU</span>}
              </div>
              <div className="text-xs text-white/50 truncate">{u.department?.code} • {u.college?.code}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-amber-300 flex items-center gap-1 justify-end">
                <Zap className="w-3 h-3" /> {u.xp}
              </div>
              <div className="text-xs text-white/50">Lvl {u.level} • {u._count.practiceAttempts} Qs</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============== BADGES ==============
function BadgesView({ dash }: any) {
  const earnedIds = new Set(dash.badges.map((b: any) => b.id));
  // Get all badges - we'll show earned & locked
  const allBadges = [
    { name: "First Steps", icon: "🌱", description: "Answered your first practice question" },
    { name: "Curious Mind", icon: "🧠", description: "Answered 10 practice questions" },
    { name: "Quiz Warrior", icon: "⚔️", description: "Answered 25 practice questions" },
    { name: "Constitution Master", icon: "🏛️", description: "Answered 50 practice questions" },
    { name: "Sharp Shooter", icon: "🎯", description: "Got 10 correct answers in a row" },
    { name: "Mock Test Rookie", icon: "📝", description: "Completed your first mock test" },
    { name: "Mock Test Pro", icon: "📊", description: "Completed 5 mock tests" },
    { name: "Perfect Score", icon: "💯", description: "Scored 100% on a mock test" },
    { name: "Week Explorer", icon: "🧭", description: "Completed practice in any week" },
    { name: "All-Rounder", icon: "🌟", description: "Practiced questions from all 8 weeks" },
    { name: "On Fire", icon: "🔥", description: "Maintained a 3-day streak" },
    { name: "Unstoppable", icon: "🚀", description: "Maintained a 7-day streak" },
    { name: "Level 5 Hero", icon: "⭐", description: "Reached level 5" },
    { name: "Level 10 Legend", icon: "👑", description: "Reached level 10" },
    { name: "XP Hunter", icon: "💎", description: "Earned 1000 XP" },
    { name: "Grand Champion", icon: "🏆", description: "Completed the Grand Final Mock Test" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
        <Award className="w-6 h-6 text-pink-300" /> Badge Collection
      </h2>
      <p className="text-white/60 text-sm mb-6">Earn badges by mastering the Constitution! {dash.badges.length}/{allBadges.length} unlocked.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allBadges.map((b, i) => {
          const earned = dash.badges.find((eb: any) => eb.name === b.name);
          const isEarned = !!earned;
          return (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl p-4 border text-center transition-all ${
                isEarned
                  ? "bg-gradient-to-br from-pink-500/15 to-purple-500/15 border-pink-400/40 cq-glow"
                  : "bg-white/5 border-white/10 grayscale opacity-60"
              }`}
            >
              <div className={`text-5xl mb-2 ${isEarned ? "cq-float" : ""}`} style={{ animationDelay: `${i * 0.1}s` }}>
                {isEarned ? b.icon : "🔒"}
              </div>
              <div className="font-bold text-sm mb-1">{b.name}</div>
              <div className="text-[10px] text-white/60 leading-tight">{b.description}</div>
              {isEarned && (
                <div className="mt-2 text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                  ✓ Unlocked
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============== HISTORY ==============
function HistoryView({ dash }: any) {
  return (
    <div>
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
        <Clock className="w-6 h-6 text-violet-300" /> Your Activity
      </h2>
      <p className="text-white/60 text-sm mb-6">Track your recent attempts and progress over time.</p>

      {/* Recent attempts */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-300" /> Recent Practice Attempts</h3>
        <div className="space-y-2">
          {dash.recentAttempts.length === 0 ? (
            <div className="text-center py-10 text-white/40">No attempts yet — start practicing!</div>
          ) : (
            dash.recentAttempts.map((a: any) => (
              <div key={a.id} className={`rounded-xl p-3 border flex items-start gap-3 ${a.isCorrect ? "bg-emerald-500/5 border-emerald-400/20" : "bg-red-500/5 border-red-400/20"}`}>
                <div className={`shrink-0 w-7 h-7 rounded flex items-center justify-center ${a.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                  {a.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{a.question?.questionText}</p>
                  <div className="text-xs text-white/40 mt-1">
                    Week {a.question?.week?.number} • Your answer: {a.selectedOption} • Correct: {a.question?.correctOption}
                  </div>
                </div>
                <div className="text-xs text-white/40 whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activity log */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-300" /> Activity Log</h3>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 max-h-96 overflow-y-auto cq-scroll">
          {dash.recentActivity.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-sm">No activity yet.</div>
          ) : (
            <div className="space-y-1.5">
              {dash.recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-white/5 last:border-0">
                  <div className="text-white/40 whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</div>
                  <div className="font-mono text-purple-300">{a.action}</div>
                  <div className="text-white/50 truncate flex-1">{a.details}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== PROFILE ==============
function ProfileView({ user, onUpdated }: { user: any; onUpdated: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", rollNumber: "", newPassword: "", currentPassword: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/profile");
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setForm({
          name: data.profile.name || "",
          phone: data.profile.phone || "",
          rollNumber: data.profile.rollNumber || "",
          newPassword: "",
          currentPassword: "",
        });
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = { name: form.name, phone: form.phone, rollNumber: form.rollNumber };
      if (form.newPassword) {
        body.newPassword = form.newPassword;
        body.currentPassword = form.currentPassword;
      }
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Profile updated!");
      setEditing(false);
      setForm(f => ({ ...f, newPassword: "", currentPassword: "" }));
      load();
      onUpdated();
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  if (!profile) return <div className="text-center py-20 text-white/60">Failed to load profile.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
        <UserIcon className="w-6 h-6 text-pink-300" /> My Profile
      </h2>
      <p className="text-white/60 text-sm mb-6">View and edit your personal information.</p>

      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center text-3xl font-black cq-glow shrink-0">
            {profile.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold truncate">{profile.name}</h3>
            <p className="text-sm text-white/60 truncate">{profile.email || profile.username}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">{profile.role}</span>
              {profile.authMethod === "FIREBASE" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold">FIREBASE</span>}
              {profile.authMethod === "LOCAL" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">LOCAL</span>}
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 transition shrink-0">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {/* Info grid (read-only) */}
        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={BookOpen} label="College" value={profile.college?.name} />
            <InfoRow icon={Shield} label="Department" value={profile.department?.name} />
            <InfoRow icon={UserIcon} label="Mentor" value={profile.mentor?.name} />
            <InfoRow icon={Hash} label="KTU Reg. Number" value={profile.rollNumber} />
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
          </div>
        ) : (
          /* Edit form */
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">KTU Register Number</label>
              <input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" placeholder="e.g., IES21CSE001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" placeholder="Your phone number" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Email <span className="text-white/40">(cannot be changed — managed by Firebase)</span></label>
              <input value={profile.email || ""} disabled className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/40 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">College / Department <span className="text-white/40">(contact admin to change)</span></label>
              <input value={`${profile.college?.name || ""} • ${profile.department?.name || ""}`} disabled className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/40 text-sm cursor-not-allowed" />
            </div>

            {/* Password change section */}
            <div className="pt-3 border-t border-white/10">
              <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-300" /> Change Password
                {profile.authMethod === "FIREBASE" && <span className="text-[10px] text-amber-300/80 ml-1">(Use Firebase reset for Firebase accounts)</span>}
              </h4>
              {profile.authMethod === "LOCAL" ? (
                <>
                  <div className="mb-2">
                    <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" placeholder="Current password (required to change)" />
                  </div>
                  <div>
                    <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" placeholder="New password (min 6 chars) — leave blank to keep" />
                  </div>
                </>
              ) : (
                <p className="text-xs text-white/50 p-3 rounded-lg bg-white/5 border border-white/10">
                  Your account uses Firebase authentication. To change your password, please use the "Forgot Password" feature on the login page, or ask your admin to reset it.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setEditing(false); setForm({ name: profile.name, phone: profile.phone, rollNumber: profile.rollNumber, newPassword: "", currentPassword: "" }); }} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm hover:bg-white/15 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-300" /> Account Details</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-white/50">Account Type:</span> <span className="font-bold text-white/80">{profile.authMethod}</span></div>
          <div><span className="text-white/50">Status:</span> <span className={`font-bold ${profile.active ? "text-emerald-300" : "text-red-300"}`}>{profile.active ? "Active" : "Inactive"}</span></div>
          <div><span className="text-white/50">Joined:</span> <span className="font-bold text-white/80">{new Date(profile.createdAt).toLocaleDateString()}</span></div>
          <div><span className="text-white/50">Last Login:</span> <span className="font-bold text-white/80">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5">
      <Icon className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{label}</div>
        <div className="text-sm text-white/90 truncate">{value || "—"}</div>
      </div>
    </div>
  );
}

// ============== HELPERS ==============
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * level * 50;
}
