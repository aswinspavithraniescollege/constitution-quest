"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, Flame, MessageCircle, Users, Send, Smile, Eye, Radio } from "lucide-react";

// DummyStudentPreview — a purely visual mockup showing what students see.
// No auth, no real data — just a static layout that updates when previewKey
// changes (so the admin/mentor can see the layout shift when toggling).
//
// type: "leaderboard" | "chat"
// previewKey: increments after each toggle, causing re-mount
export function DummyStudentPreview({ type, previewKey }: { type: "leaderboard" | "chat"; previewKey: number }) {
  return (
    <motion.div
      key={previewKey}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden border-2 border-amber-300/40 shadow-lg"
    >
      {/* Header bar */}
      <div className="bg-amber-500/15 px-4 py-2 flex items-center gap-2 border-b border-amber-300/20">
        <Eye className="w-4 h-4 text-amber-400" />
        <span className="font-bold text-amber-200 text-sm">
          Student Preview — {type === "leaderboard" ? "Leaderboard" : "Chat"}
        </span>
        <span className="text-[10px] text-amber-300/50 ml-auto">
          This is what students see ↘
        </span>
      </div>

      {/* Preview body — dark themed like the student app */}
      <div
        className="p-4"
        style={{
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        {type === "leaderboard" ? <DummyLeaderboard /> : <DummyChat />}
      </div>
    </motion.div>
  );
}

// ============================================================
// DUMMY LEADERBOARD — visual mockup
// ============================================================
function DummyLeaderboard() {
  const entries = [
    { name: "Aswin S Pavithran", xp: 850, level: 5, streak: 7, isYou: false },
    { name: "Angela C Joy", xp: 720, level: 4, streak: 3, isYou: false },
    { name: "You (Demo Student)", xp: 450, level: 3, streak: 2, isYou: true },
    { name: "Rahul Sharma", xp: 300, level: 2, streak: 1, isYou: false },
    { name: "Priya Nair", xp: 150, level: 1, streak: 0, isYou: false },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" /> Live Leaderboard
        </h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Radio className="w-3 h-3" /> LIVE
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
          My College
        </div>
        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60">
          My Department
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border flex items-center gap-3 ${
              e.isYou
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50"
                : i === 0
                ? "bg-amber-500/10 border-amber-400/30"
                : i === 1
                ? "bg-slate-400/10 border-slate-300/30"
                : i === 2
                ? "bg-orange-700/10 border-orange-600/30"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                i === 0
                  ? "bg-amber-500 text-white"
                  : i === 1
                  ? "bg-slate-400 text-slate-900"
                  : i === 2
                  ? "bg-orange-700 text-white"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate flex items-center gap-2 text-white">
                {e.name}
                {e.isYou && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 truncate">IES • CE</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-amber-300 flex items-center gap-1 justify-end">
                <Zap className="w-3.5 h-3.5" /> {e.xp}
              </div>
              <div className="text-xs text-white/50 flex items-center gap-2 justify-end">
                <span>Lvl {e.level}</span>
                <span className="flex items-center gap-0.5 text-orange-300">
                  <Flame className="w-3 h-3" />
                  {e.streak}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-white/30 mt-4">
        Showing active students in your college (IES). Deleted accounts are hidden.
      </p>
    </div>
  );
}

// ============================================================
// DUMMY CHAT — visual mockup
// ============================================================
function DummyChat() {
  const messages = [
    { name: "Aswin S Pavithran", role: "MENTOR", text: "Welcome to the department chat! 👋", isOwn: false, time: "10m ago" },
    { name: "Angela C Joy", role: "STUDENT", text: "Hi sir! Thanks for setting this up 😊", isOwn: false, time: "8m ago" },
    { name: "You", role: "STUDENT", text: "Hello everyone! Excited to learn 🎓", isOwn: true, time: "5m ago" },
    { name: "Rahul Sharma", role: "STUDENT", text: "Same here! Ready for the mock test 📚", isOwn: false, time: "2m ago" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" /> My Department Chat
        </h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Radio className="w-3 h-3" /> LIVE
        </span>
      </div>

      {/* Top toggle */}
      <div className="flex gap-2 mb-4">
        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Group Chats
        </div>
        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 flex items-center gap-2">
          <Users className="w-4 h-4" /> Direct Messages
          <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.5 rounded-full">3</span>
        </div>
      </div>

      {/* Chat tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 border border-cyan-400/30 text-white">
          My Department
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/50">
          Students Only
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/50">
          My College
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/50">
          Global
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2 mb-3 p-2 rounded-xl bg-white/5 border border-white/10 min-h-[200px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 ${
                msg.isOwn
                  ? "bg-cyan-500/20 border border-cyan-400/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/80">{msg.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    msg.role === "MENTOR"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {msg.role}
                </span>
              </div>
              <p className="text-sm text-white/90 break-words whitespace-pre-wrap">{msg.text}</p>
              <div className="text-[10px] text-white/30 mt-1 text-right">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative flex gap-2">
          <div className="px-3 rounded-xl bg-white/5 border border-white/15 text-white/60 flex items-center shrink-0">
            <Smile className="w-5 h-5" />
          </div>
          <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white/30 text-sm">
            Message My Department chat...
          </div>
        </div>
        <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center">
          <Send className="w-4 h-4" />
        </div>
      </div>
      <p className="text-[10px] text-white/30 mt-2 text-center">
        Messages reset at midnight daily · Be respectful · Your name and role are visible to others
      </p>
    </div>
  );
}
