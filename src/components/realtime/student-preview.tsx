"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Crown, MessageCircle, Eye, AlertCircle } from "lucide-react";
import { RealtimeLeaderboard } from "./realtime-leaderboard";
import { ChatView } from "./chat-view";

// StudentPreview — a full-screen overlay that shows admins and mentors what
// students actually see: the leaderboard and chat sections. This lets them
// preview the student experience even when those features are toggled off.
//
// The preview uses the admin/mentor's own user object (with role overridden
// to STUDENT) so the leaderboard and chat config endpoints return what a
// student in their college/department would see.
export function StudentPreview({ user, onClose }: { user: any; onClose: () => void }) {
  const [tab, setTab] = useState<"leaderboard" | "chat">("leaderboard");

  // Create a simulated student user object from the admin/mentor's data.
  // This ensures the leaderboard and chat components fetch the right config
  // (college-scoped, department-scoped) as if the viewer were a student.
  const studentUser = {
    ...user,
    role: "STUDENT", // override role so /api/chat/config returns student chats
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Student Preview</h1>
              <p className="text-xs text-white/50">
                This is what students see. Features shown here may be toggled off for students — this preview lets you see what they look like when enabled.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Close Preview
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80">
            You are viewing the student interface as a preview. The leaderboard and chat shown here reflect your college and department settings. If a feature appears empty or disabled, it may be toggled off for students — check the Leaderboard and Chat tabs in your dashboard to manage visibility.
          </p>
        </div>

        {/* Tabs: Leaderboard vs Chat */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("leaderboard")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              tab === "leaderboard"
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <Crown className="w-4 h-4" /> Leaderboard
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              tab === "chat"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "leaderboard" ? (
            <RealtimeLeaderboard user={studentUser} />
          ) : (
            <ChatView user={studentUser} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
