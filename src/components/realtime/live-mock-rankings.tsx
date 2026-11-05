"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Radio, Loader2, CheckCircle2, Clock, Play } from "lucide-react";
import { subscribeToMockRankings, timeAgo, type MockRanking } from "@/lib/firestore";

export function LiveMockRankings({ mockTestId, mockTestTitle }: { mockTestId: string; mockTestTitle: string }) {
  const [rankings, setRankings] = useState<MockRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMockRankings(mockTestId, (data) => { setRankings(data); setLoading(false); });
    return () => { unsub(); };
  }, [mockTestId]);

  const completed = rankings.filter(r => r.status === "completed");
  const inProgress = rankings.filter(r => r.status === "in_progress");

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-300" /> Live Rankings</h4>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
        </span>
      </div>

      {loading ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div> :
        rankings.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">No participants yet. Be the first!</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto cq-scroll">
            {completed.length > 0 && (
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed ({completed.length})</div>
            )}
            {completed.map((r, i) => {
              const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} layout
                  className={`flex items-center gap-2 p-2 rounded-lg ${i === 0 ? "bg-amber-500/10 border border-amber-400/30" : "bg-white/5"}`}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${i === 0 ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{r.userName}</div>
                    {r.collegeCode && <div className="text-[10px] text-white/40">{r.collegeCode}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${pct >= 75 ? "text-emerald-300" : pct >= 50 ? "text-amber-300" : "text-red-300"}`}>{r.score}/{r.total}</div>
                    <div className="text-[10px] text-white/40">{pct}%</div>
                  </div>
                </motion.div>
              );
            })}
            {inProgress.length > 0 && (
              <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold mb-1 mt-2 flex items-center gap-1"><Play className="w-3 h-3" /> In Progress ({inProgress.length})</div>
            )}
            {inProgress.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} layout
                className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-400/20">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"><Clock className="w-3 h-3 text-cyan-300 animate-pulse" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{r.userName}</div>
                  <div className="text-[10px] text-cyan-300/60">Started {timeAgo(r.startedAt)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      }
    </div>
  );
}
