"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Flame, Loader2, Radio, EyeOff, Building2, Users } from "lucide-react";
import { subscribeToLeaderboard, timeAgo, type LeaderboardEntry } from "@/lib/firestore";

type Tab = "college" | "department";

type Config = {
  collegeLeaderboardVisible: boolean;
  departmentLeaderboardVisible: boolean;
  collegeUserIds: string[];
  departmentUserIds: string[];
  collegeCode: string | null;
  deptCode: string | null;
};

// RealtimeLeaderboard
// Students see TWO scopes (controlled by admin/mentor visibility settings):
//   - "College"      : all active students in their college
//   - "My Department": active students in their specific department
// Deleted users are filtered out via the collegeUserIds/departmentUserIds sets
// fetched from the server (DB is the source of truth; Firestore entries can
// linger for deleted users). This also scopes the view so students never see
// a global leaderboard — only their own college/department peers.
export function RealtimeLeaderboard({ user }: { user: any }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("college");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // 1. Fetch the visibility config + valid userIds from the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConfigLoading(true);
      try {
        const res = await fetch("/api/student/leaderboard-config");
        if (!res.ok) {
          if (!cancelled) setConfig(null);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setConfig(data);
        // Pick the default tab: department if visible, else college if visible.
        if (data.departmentLeaderboardVisible) setTab("department");
        else if (data.collegeLeaderboardVisible) setTab("college");
      } catch (e) {
        console.error("leaderboard-config fetch failed:", e);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2. Subscribe to the Firestore leaderboard (college-scoped) for real-time
  //    XP/streak updates. We fetch the whole college's entries once and filter
  //    client-side into the two tabs — this avoids two Firestore subscriptions
  //    and keeps the live updates instant.
  useEffect(() => {
    if (!config || !config.collegeCode) {
      setLiveLoading(false);
      setEntries([]);
      return;
    }
    setLiveLoading(true);
    const unsub = subscribeToLeaderboard("college", config.collegeCode, (data) => {
      setEntries(data);
      setLiveLoading(false);
    });
    return () => { unsub(); };
  }, [config?.collegeCode]);

  // 3. Filter entries for the active tab AND drop deleted users.
  const visibleEntries = useMemo(() => {
    if (!config) return [];
    const validSet = tab === "department"
      ? new Set(config.departmentUserIds)
      : new Set(config.collegeUserIds);
    // Filter to valid (non-deleted, in-scope) users, then sort by XP desc.
    return entries
      .filter(e => validSet.has(e.userId))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.level || 0) - (a.level || 0));
  }, [entries, tab, config]);

  // ---- Render states ----
  if (configLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;
  }

  if (!config) {
    return (
      <div className="text-center py-16 text-white/40">
        <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Couldn&apos;t load the leaderboard. Please try again later.</p>
      </div>
    );
  }

  const showCollege = config.collegeLeaderboardVisible;
  const showDepartment = config.departmentLeaderboardVisible;

  // If both scopes are disabled, show a disabled message.
  if (!showCollege && !showDepartment) {
    return (
      <div className="text-center py-16 text-white/40">
        <EyeOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-bold text-white/60">Leaderboard is currently disabled</p>
        <p className="text-sm mt-1">Your administrator can re-enable it.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2"><Crown className="w-6 h-6 text-yellow-400" /> Live Leaderboard</h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><Radio className="w-3 h-3" /> LIVE
        </span>
      </div>

      {/* Scope tabs */}
      <div className="flex gap-2 mb-4">
        {showCollege && (
          <button
            onClick={() => setTab("college")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === "college"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" /> My College
          </button>
        )}
        {showDepartment && (
          <button
            onClick={() => setTab("department")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === "department"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> My Department
          </button>
        )}
      </div>

      {liveLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
      ) : visibleEntries.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No entries yet. Be the first to earn XP!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleEntries.map((entry, i) => {
            const isCurrentUser = entry.userId === user.id;
            return (
              <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} layout
                className={`rounded-2xl p-4 border flex items-center gap-3 ${isCurrentUser ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 cq-glow" : i === 0 ? "bg-amber-500/10 border-amber-400/30" : i === 1 ? "bg-slate-400/10 border-slate-300/30" : i === 2 ? "bg-orange-700/10 border-orange-600/30" : "bg-white/5 border-white/10"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-slate-900" : i === 2 ? "bg-orange-700 text-white" : "bg-white/10 text-white/70"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate flex items-center gap-2">{entry.name}{isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">YOU</span>}</div>
                  <div className="text-xs text-white/50 truncate">{entry.collegeCode || "—"} • {entry.deptCode || "—"}{entry.updatedAt && <span className="ml-1">• {timeAgo(entry.updatedAt)}</span>}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-amber-300 flex items-center gap-1 justify-end"><Zap className="w-3.5 h-3.5" /> {entry.xp}</div>
                  <div className="text-xs text-white/50 flex items-center gap-2 justify-end"><span>Lvl {entry.level}</span><span className="flex items-center gap-0.5 text-orange-300"><Flame className="w-3 h-3" />{entry.streak}</span></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-white/30 mt-4">
        {tab === "department"
          ? `Showing active students in your department${config.deptCode ? ` (${config.deptCode})` : ""}.`
          : `Showing active students in your college${config.collegeCode ? ` (${config.collegeCode})` : ""}.`}
        {" "}Deleted accounts are hidden.
      </p>
    </div>
  );
}
