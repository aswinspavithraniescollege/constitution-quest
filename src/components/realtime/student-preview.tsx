"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X, Crown, Zap, Flame, MessageCircle, Send, Smile, Eye, Home, Brain, Target,
  Award, Bookmark, Users, Loader2, CheckCircle2, XCircle, Radio, ChevronRight,
} from "lucide-react";

// StudentFullPreview — a full-screen dummy student app preview.
// - Practice and Mock Tests actually work (real questions fetched from API)
// - Chat shows dummy messages; sending shows "This is a preview page"
// - Leaderboard shows dummy entries (or "disabled" if toggled off)
// - Nav buttons grey out when the mentor/admin toggles features off
export function StudentPreview({ user, onClose }: { user: any; onClose: () => void }) {
  const [view, setView] = useState<"home" | "practice-list" | "practice-play" | "mock-list" | "leaderboard" | "chat" | "forum" | "bookmarks" | "badges">("home");
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loadingQs, setLoadingQs] = useState(false);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [lbConfig, setLbConfig] = useState<{ collegeVisible: boolean; deptVisible: boolean } | null>(null);
  const [chatTabs, setChatTabs] = useState<{ type: string; label: string; visible: boolean }[]>([]);
  const [dmVisible, setDmVisible] = useState(true);

  // Derived: is the entire leaderboard disabled?
  const lbDisabled = lbConfig ? !lbConfig.collegeVisible && !lbConfig.deptVisible : false;
  // Derived: is the entire chat disabled?
  const chatDisabled = chatTabs.length > 0 ? chatTabs.every(c => !c.visible) && !dmVisible : false;

  // Fetch weeks + check settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/weeks");
        const data = await res.json();
        setWeeks(data.weeks || []);
      } catch {}
      // Check leaderboard settings
      try {
        const cfgRes = await fetch("/api/student/leaderboard-config");
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          setLbConfig({
            collegeVisible: !!cfg.collegeLeaderboardVisible,
            deptVisible: !!cfg.departmentLeaderboardVisible,
          });
        }
      } catch {}
      // Check chat settings
      try {
        const chatRes = await fetch("/api/chat/config?preview=student");
        if (chatRes.ok) {
          const chatCfg = await chatRes.json();
          setChatTabs((chatCfg.chats || []).map((c: any) => ({ type: c.type, label: c.label, visible: c.visible })));
          setDmVisible(!!(chatCfg.dm?.visible));
        }
      } catch {}
    })();
  }, []);

  // Fetch questions when a week is selected
  const fetchQuestions = useCallback(async (weekId: string) => {
    setLoadingQs(true);
    try {
      const res = await fetch(`/api/student/questions?weekId=${weekId}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch {
      setQuestions([]);
    } finally { setLoadingQs(false); }
  }, []);

  // Fetch mock tests
  useEffect(() => {
    if (view === "mock-list") {
      (async () => {
        try {
          const res = await fetch("/api/student/mock-tests");
          const data = await res.json();
          setMockTests(data.mockTests || []);
        } catch {}
      })();
    }
  }, [view]);

  const navItems = [
    { key: "home", label: "Home", icon: Home, color: "from-purple-500 to-pink-500", alwaysOn: true },
    { key: "practice-list", label: "Practice", icon: Brain, color: "from-blue-500 to-cyan-500", alwaysOn: true },
    { key: "mock-list", label: "Mock Tests", icon: Target, color: "from-amber-500 to-orange-500", alwaysOn: true },
    { key: "leaderboard", label: "Leaderboard", icon: Crown, color: "from-yellow-500 to-amber-500", alwaysOn: !lbDisabled },
    { key: "chat", label: "Chat", icon: MessageCircle, color: "from-cyan-500 to-teal-500", alwaysOn: !chatDisabled },
    { key: "forum", label: "Forum", icon: MessageCircle, color: "from-cyan-500 to-blue-500", alwaysOn: true },
    { key: "bookmarks", label: "Notes", icon: Bookmark, color: "from-amber-500 to-yellow-500", alwaysOn: true },
    { key: "badges", label: "Badges", icon: Award, color: "from-green-500 to-emerald-500", alwaysOn: true },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-amber-500/20 border-b border-amber-400/30 backdrop-blur-xl px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-200 text-sm">STUDENT PREVIEW MODE</span>
          <span className="text-[10px] text-amber-300/60 hidden sm:inline">· Practice & Mock Tests work · Chat is read-only</span>
        </div>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1">
          <X className="w-4 h-4" /> Exit Preview
        </button>
      </div>

      {/* Student header */}
      <header className="sticky top-[40px] z-40 backdrop-blur-xl bg-slate-950/70 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center cq-glow shrink-0 overflow-hidden">
              <img src="/logo-48.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-base sm:text-lg leading-tight bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-[10px] sm:text-xs text-white/50 leading-tight truncate">{user.college?.name || "IES College"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-300 flex items-center gap-1"><Zap className="w-3 h-3" /> 40 XP</span>
            <span className="text-purple-300">Lvl 1</span>
            <span className="text-orange-300 flex items-center gap-1"><Flame className="w-3 h-3" /> 1</span>
          </div>
        </div>
      </header>

      {/* Nav grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        <div className="grid grid-cols-4 gap-2 mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isOn = item.alwaysOn;
            const isActive = view === item.key || (item.key === "practice-list" && view === "practice-play");
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (!isOn) { toast.info("This feature is currently disabled for students."); return; }
                  setView(item.key as any);
                }}
                disabled={!isOn}
                className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border transition ${
                  isActive
                    ? `bg-gradient-to-br ${item.color} border-white/20 text-white shadow-lg`
                    : isOn
                    ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    : "bg-white/5 border-white/10 text-white/20 opacity-40 cursor-not-allowed"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[9px] sm:text-xs font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* HOME */}
            {view === "home" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black text-white">Welcome back! 👋</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"><Zap className="w-5 h-5 mb-2 text-amber-400" /><div className="text-2xl font-black text-white">40</div><div className="text-xs text-white/50">Total XP</div></div>
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4"><Award className="w-5 h-5 mb-2 text-purple-400" /><div className="text-2xl font-black text-white">Lvl 1</div><div className="text-xs text-white/50">Level</div></div>
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4"><Flame className="w-5 h-5 mb-2 text-orange-400" /><div className="text-2xl font-black text-white">1</div><div className="text-xs text-white/50">Day Streak</div></div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4"><Brain className="w-5 h-5 mb-2 text-cyan-400" /><div className="text-2xl font-black text-white">0</div><div className="text-xs text-white/50">Questions Done</div></div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <h3 className="font-bold text-white mb-2">📚 Weekly Progress</h3>
                  {weeks.length === 0 ? <p className="text-sm text-white/40">No weeks available yet.</p> : weeks.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-white/40 w-12">Week {w.number}</span>
                      <span className="text-white/70 flex-1 truncate">{w.title}</span>
                      <span className="text-[10px] text-cyan-300">{w._count?.questions || 0} Qs</span>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRACTICE LIST */}
            {view === "practice-list" && (
              <div>
                <h2 className="text-xl font-black text-white mb-4">📚 Practice Questions</h2>
                {weeks.length === 0 ? <p className="text-white/40 text-center py-8">No weeks available yet.</p> : (
                  <div className="space-y-2">
                    {weeks.map((w) => (
                      <button key={w.id} onClick={() => { setSelectedWeek(w); fetchQuestions(w.id); setView("practice-play"); }}
                        className="w-full text-left rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-purple-400/30 transition">
                        <div className="font-bold text-white">Week {w.number}: {w.title}</div>
                        <div className="text-xs text-white/50 mt-1">{w._count?.questions || 0} questions · {w._count?.mockTests || 0} mock tests</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PRACTICE PLAY */}
            {view === "practice-play" && (
              <div>
                <button onClick={() => setView("practice-list")} className="text-xs text-white/50 hover:text-white mb-3 flex items-center gap-1">← Back to weeks</button>
                {loadingQs ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div> :
                 questions.length === 0 ? <p className="text-white/40 text-center py-8">No questions in this week.</p> :
                 questions.length > 0 && currentQ < questions.length ? (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/40">Question {currentQ + 1} of {questions.length}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">{questions[currentQ].difficulty}</span>
                    </div>
                    <p className="text-white font-bold mb-4">{questions[currentQ].questionText}</p>
                    <div className="space-y-2">
                      {(["A", "B", "C", "D"] as const).map((opt) => {
                        const text = questions[currentQ][`option${opt}`];
                        const isCorrect = questions[currentQ].correctOption === opt;
                        const isSelected = selectedAnswer === opt;
                        let cls = "bg-white/5 border-white/10 text-white/70 hover:bg-white/10";
                        if (showResult) {
                          if (isCorrect) cls = "bg-emerald-500/20 border-emerald-400/40 text-emerald-200";
                          else if (isSelected) cls = "bg-red-500/20 border-red-400/40 text-red-200";
                          else cls = "bg-white/5 border-white/10 text-white/30";
                        } else if (isSelected) {
                          cls = "bg-purple-500/20 border-purple-400/40 text-white";
                        }
                        return (
                          <button key={opt} disabled={showResult}
                            onClick={() => { setSelectedAnswer(opt); setShowResult(true); }}
                            className={`w-full text-left p-3 rounded-xl border transition ${cls}`}>
                            <span className="font-bold mr-2">{opt}.</span> {text}
                            {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2 text-emerald-400" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 inline ml-2 text-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                    {showResult && (
                      <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20">
                        <p className="text-xs text-blue-200 font-bold mb-1">💡 Explanation</p>
                        <p className="text-xs text-white/70">{questions[currentQ].explanation}</p>
                      </div>
                    )}
                    {showResult && currentQ < questions.length - 1 && (
                      <button onClick={() => { setCurrentQ(c => c + 1); setSelectedAnswer(null); setShowResult(false); }}
                        className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm">
                        Next Question →
                      </button>
                    )}
                    {showResult && currentQ === questions.length - 1 && (
                      <p className="mt-4 text-center text-sm text-emerald-300 font-bold">🎉 You've completed all questions in this week!</p>
                    )}
                    <p className="text-[10px] text-amber-300/60 mt-3 text-center">⚠️ Preview mode — answers are not saved to your account</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* MOCK TESTS */}
            {view === "mock-list" && (
              <div>
                <h2 className="text-xl font-black text-white mb-4">🎯 Mock Tests</h2>
                {mockTests.length === 0 ? <p className="text-white/40 text-center py-8">No mock tests available yet.</p> : (
                  <div className="space-y-2">
                    {mockTests.map((mt) => (
                      <div key={mt.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="font-bold text-white">{mt.title}</div>
                        <div className="text-xs text-white/50 mt-1">{mt.durationMin} min · {JSON.parse(mt.questionIds || "[]").length} questions</div>
                        <div className="mt-2 text-[10px] text-amber-300/60">⚠️ Preview mode — mock test attempts are not saved</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD */}
            {view === "leaderboard" && (
              lbDisabled ? (
                <div className="text-center py-16 text-white/40">
                  <Crown className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-white/60">Leaderboard is currently disabled</p>
                  <p className="text-sm mt-1">Your administrator can re-enable it.</p>
                </div>
              ) : (
                <DummyLeaderboard collegeVisible={lbConfig?.collegeVisible ?? true} deptVisible={lbConfig?.deptVisible ?? true} />
              )
            )}

            {/* CHAT */}
            {view === "chat" && (
              chatDisabled ? (
                <div className="text-center py-16 text-white/40">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-white/60">All chats are currently disabled</p>
                  <p className="text-sm mt-1">Your administrator can re-enable them.</p>
                </div>
              ) : (
                <DummyChatPreview chatTabs={chatTabs} dmVisible={dmVisible} />
              )
            )}

            {/* FORUM */}
            {view === "forum" && (
              <div className="text-center py-16 text-white/40">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-white/60">Discussion Forum</p>
                <p className="text-sm mt-1">Preview mode — forum content not shown</p>
              </div>
            )}

            {/* BOOKMARKS */}
            {view === "bookmarks" && (
              <div className="text-center py-16 text-white/40">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-white/60">Notes & Bookmarks</p>
                <p className="text-sm mt-1">Preview mode — notes not shown</p>
              </div>
            )}

            {/* BADGES */}
            {view === "badges" && (
              <div className="text-center py-16 text-white/40">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-white/60">Badges</p>
                <p className="text-sm mt-1">Preview mode — badges not shown</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// DUMMY LEADERBOARD — shows/hides tabs based on real settings
// ============================================================
function DummyLeaderboard({ collegeVisible, deptVisible }: { collegeVisible: boolean; deptVisible: boolean }) {
  const entries = [
    { name: "Aswin S Pavithran", xp: 850, level: 5, streak: 7 },
    { name: "Angela C Joy", xp: 720, level: 4, streak: 3 },
    { name: "You (Preview)", xp: 450, level: 3, streak: 2, isYou: true },
    { name: "Rahul Sharma", xp: 300, level: 2, streak: 1 },
    { name: "Priya Nair", xp: 150, level: 1, streak: 0 },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> Live Leaderboard</h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><Radio className="w-3 h-3" /> LIVE
        </span>
      </div>
      {/* Tabs — only show visible ones */}
      <div className="flex gap-2 mb-4">
        {collegeVisible && (
          <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 border border-cyan-400/30 text-white">My College</div>
        )}
        {deptVisible && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!collegeVisible ? "bg-white/10 border-cyan-400/30 text-white" : "bg-white/5 border-white/10 text-white/50"}`}>My Department</div>
        )}
        {!collegeVisible && !deptVisible && (
          <div className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/30">No tabs available</div>
        )}
      </div>
      {/* Show disabled notice for hidden tabs */}
      {!collegeVisible && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-400/20 text-center">
          <span className="text-xs text-red-300">⛔ College leaderboard is hidden from your students</span>
        </div>
      )}
      {!deptVisible && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-400/20 text-center">
          <span className="text-xs text-red-300">⛔ Department leaderboard is hidden from your students</span>
        </div>
      )}
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={i} className={`rounded-2xl p-3 border flex items-center gap-3 ${e.isYou ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50" : i === 0 ? "bg-amber-500/10 border-amber-400/30" : "bg-white/5 border-white/10"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0 text-sm ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-slate-900" : i === 2 ? "bg-orange-700 text-white" : "bg-white/10 text-white/70"}`}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate text-white text-sm flex items-center gap-1">{e.name}{e.isYou && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">YOU</span>}</div>
              <div className="text-[10px] text-white/50">IES • CE</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-amber-300 flex items-center gap-1 justify-end text-sm"><Zap className="w-3 h-3" />{e.xp}</div>
              <div className="text-[10px] text-white/50 flex items-center gap-1 justify-end"><span>Lvl {e.level}</span><span className="flex items-center gap-0.5 text-orange-300"><Flame className="w-2.5 h-2.5" />{e.streak}</span></div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/30 mt-3 text-center">Dummy data — preview mode</p>
    </div>
  );
}

// ============================================================
// DUMMY CHAT — shows/hides tabs based on real settings, "preview" on send
// ============================================================
function DummyChatPreview({ chatTabs, dmVisible }: { chatTabs: { type: string; label: string; visible: boolean }[]; dmVisible: boolean }) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const dummyMessages = [
    { name: "Aswin S Pavithran (Mentor)", role: "MENTOR", text: "Welcome to the department chat! 👋", time: "10m ago" },
    { name: "Angela C Joy", role: "STUDENT", text: "Hi sir! Thanks for setting this up 😊", time: "8m ago" },
    { name: "Rahul Sharma", role: "STUDENT", text: "Hello everyone! Ready to learn 🎓", time: "5m ago" },
  ];
  const EMOJIS = ["😀","😂","🥰","😎","🤔","👍","❤️","🔥","🎉","✅","❌","📚","🎓","⚖️","🇮🇳"];
  const visibleTabs = chatTabs.filter(t => t.visible);
  const hiddenTabs = chatTabs.filter(t => !t.visible);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim()) {
      toast.info("This is a preview page. Messages cannot be sent.", { duration: 3000 });
      setText("");
      setShowEmojis(false);
    }
  }

  return (
    <div className="flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-black flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> My Department Chat</h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><Radio className="w-3 h-3" /> LIVE
        </span>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">Group Chats</div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${dmVisible ? "bg-white/5 border-white/10 text-white/60" : "bg-white/5 border-white/10 text-white/20 opacity-40"}`}>
          Direct Messages
          {dmVisible ? <span className="text-[9px] bg-cyan-500/30 px-1 rounded-full">3</span> : <span className="text-[9px] text-red-300">⛔</span>}
        </div>
      </div>
      {/* Chat tabs — only show visible ones */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {visibleTabs.map((tab) => (
          <div key={tab.type} className="px-3 py-1 rounded-lg text-xs font-bold bg-white/10 border border-cyan-400/30 text-white">{tab.label}</div>
        ))}
        {visibleTabs.length === 0 && <div className="px-3 py-1 rounded-lg text-xs font-bold text-white/30">No chat tabs available</div>}
      </div>
      {/* Show disabled notices for hidden tabs */}
      {hiddenTabs.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-400/20">
          {hiddenTabs.map((tab) => (
            <div key={tab.type} className="text-xs text-red-300 text-center">⛔ {tab.label} chat is hidden from your students</div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 p-2 rounded-xl bg-white/5 border border-white/10 min-h-[200px]">
        {dummyMessages.map((msg, i) => (
          <div key={i} className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-2xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/80">{msg.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${msg.role === "MENTOR" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border border-amber-400/30"}`}>{msg.role}</span>
              </div>
              <p className="text-sm text-white/90">{msg.text}</p>
              <div className="text-[10px] text-white/30 mt-1 text-right">{msg.time}</div>
            </div>
          </div>
        ))}
        <div className="text-center py-2">
          <span className="text-[10px] text-amber-300/60 bg-amber-500/10 px-3 py-1 rounded-full">⚠️ Preview mode — dummy messages</span>
        </div>
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <div className="flex-1 relative flex gap-2">
          <button type="button" onClick={() => setShowEmojis(s => !s)} className="px-3 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white flex items-center shrink-0">
            <Smile className="w-5 h-5" />
          </button>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." maxLength={1000}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 text-sm" />
          <AnimatePresence>
            {showEmojis && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 left-0 bg-slate-900/95 border border-white/15 rounded-2xl p-2 shadow-2xl z-50">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJIS.map((emoji, i) => (
                    <button key={i} type="button" onClick={() => setText(t => t + emoji)} className="text-xl hover:bg-white/10 rounded p-1">{emoji}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button type="submit" disabled={!text.trim()} className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[10px] text-white/30 mt-2 text-center">Messages reset at midnight daily · Preview mode — sending is disabled</p>
    </div>
  );
}
