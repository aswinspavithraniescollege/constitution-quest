"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Radio, Loader2, LogIn, LogOut, Brain, Target, Award, Zap, UserPlus, Edit } from "lucide-react";
import { subscribeToActivityFeed, timeAgo, type ActivityEntry } from "@/lib/firestore";

const ACTION_ICONS: Record<string, any> = {
  login: LogIn, logout: LogOut, practice_answer: Brain, practice_view: Brain,
  mock_start: Target, mock_complete: Target, signup: UserPlus,
  badge_earned: Award, xp_earned: Zap, profile_update: Edit,
};

export function RealtimeActivityFeed({ scope = "global", collegeCode }: { scope?: "global" | "college"; collegeCode?: string | null }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToActivityFeed(scope, collegeCode || null, (data) => {
      setActivities(data);
      setLoading(false);
    });
    return () => { unsub(); };
  }, [scope, collegeCode]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2 justify-between">
        <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Live Activity Feed</span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
        </span>
      </h3>
      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div> :
        activities.length === 0 ? <div className="text-sm text-slate-400 py-6 text-center">No recent activity. Actions will appear here in real-time.</div> :
        <div className="space-y-2 max-h-96 overflow-y-auto cq-scroll">
          {activities.map((a, i) => {
            const Icon = ACTION_ICONS[a.action] || Activity;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800">{a.userName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[9px] font-bold uppercase">{a.userRole}</span>
                    {a.collegeCode && <span className="text-slate-400">• {a.collegeCode}</span>}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    <code className="text-purple-600">{a.action}</code>
                    {a.details && <span className="ml-1 text-slate-400 truncate">{a.details}</span>}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{timeAgo(a.timestamp)}</div>
              </motion.div>
            );
          })}
        </div>
      }
    </div>
  );
}
