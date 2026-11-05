"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Zap, Flame, Loader2, Radio } from "lucide-react";
import { subscribeToLeaderboard, timeAgo, type LeaderboardEntry } from "@/lib/firestore";

export function RealtimeLeaderboard({ user, scope = "global", collegeCode }: { user: any; scope?: "global" | "college"; collegeCode?: string | null }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToLeaderboard(scope, collegeCode || null, (data) => {
      setEntries(data);
      setLoading(false);
    });
    return () => { unsub(); };
  }, [scope, collegeCode]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2"><Crown className="w-6 h-6 text-yellow-400" /> Live Leaderboard</h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><Radio className="w-3 h-3" /> LIVE
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="text-center py-16 text-white/40"><Crown className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No entries yet. Be the first to earn XP!</p></div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
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
    </div>
  );
}
