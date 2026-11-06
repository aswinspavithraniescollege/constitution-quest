"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, Filter, Users, Brain, Target, Award, Zap, Flame,
  CheckCircle2, XCircle, TrendingUp, Clock, Crown, ChevronRight, Download
} from "lucide-react";

export function ResultsView({ user, apiBase, onExit }: { user: any; apiBase: string; onExit: () => void }) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isMainAdmin = user.role === "ADMIN";

  // Load colleges (main admin only)
  useEffect(() => {
    if (!isMainAdmin) {
      // Sub-admin / mentor: load students directly
      loadStudents();
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/colleges");
        const data = await res.json();
        setColleges(data.colleges || []);
      } finally { setLoading(false); }
    })();
  }, []);

  // Load mentors when college changes
  useEffect(() => {
    if (!isMainAdmin || !selectedCollege) { setMentors([]); return; }
    (async () => {
      const res = await fetch(`/api/admin/mentors?collegeId=${selectedCollege}`);
      const data = await res.json();
      setMentors(data.mentors || []);
    })();
  }, [selectedCollege, isMainAdmin]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (isMainAdmin && selectedCollege) params.set("collegeId", selectedCollege);
      if (selectedMentor) params.set("mentorId", selectedMentor);
      const res = await fetch(`${apiBase}?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  }, [apiBase, isMainAdmin, selectedCollege, selectedMentor]);

  useEffect(() => {
    if (isMainAdmin && !selectedCollege) { setStudents([]); setLoading(false); return; }
    loadStudents();
  }, [loadStudents, isMainAdmin, selectedCollege]);

  // Load student detail
  useEffect(() => {
    if (!selectedStudent) { setStudentDetail(null); return; }
    (async () => {
      const res = await fetch(`${apiBase}?studentId=${selectedStudent}`);
      const data = await res.json();
      if (res.ok) setStudentDetail(data);
      else toast.error(data.error);
    })();
  }, [selectedStudent, apiBase]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-purple-600" /> Student Results & Analytics
        </h2>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {isMainAdmin && (
          <select value={selectedCollege} onChange={e => { setSelectedCollege(e.target.value); setSelectedMentor(""); }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="">All Colleges</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {isMainAdmin && selectedCollege && (
          <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="">All Mentors</option>
            {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <button onClick={loadStudents} className="px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Student List */}
      {!selectedStudent && (
        <div>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div> :
            students.length === 0 ? <div className="text-center py-12 text-slate-400">No students found. Select a college/mentor to view results.</div> :
            <div className="space-y-2">
              {students.map((s, i) => (
                <button key={s.id} onClick={() => setSelectedStudent(s.id)}
                  className="w-full text-left rounded-xl bg-white border border-slate-200 p-3 hover:border-purple-300 hover:shadow-sm transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                        {s.name}
                        {s.rollNumber && <span className="text-xs text-slate-500">{s.rollNumber}</span>}
                        {s.department && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{s.department.code}</span>}
                      </div>
                      {s.mentor && <div className="text-xs text-slate-500 mt-0.5">Mentor: {s.mentor.name}</div>}
                    </div>
                    <div className="flex gap-3 text-xs shrink-0">
                      <div className="text-center"><div className="font-black text-amber-600">{s.xp}</div><div className="text-[9px] text-slate-400">XP</div></div>
                      <div className="text-center"><div className="font-black text-purple-600">L{s.level}</div><div className="text-[9px] text-slate-400">LVL</div></div>
                      <div className="text-center"><div className="font-black text-cyan-600">{s.accuracy}%</div><div className="text-[9px] text-slate-400">ACC</div></div>
                      <div className="text-center"><div className="font-black text-emerald-600">{s.mockCount}</div><div className="text-[9px] text-slate-400">MOCK</div></div>
                      <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          }
        </div>
      )}

      {/* Student Detail */}
      <AnimatePresence>
        {selectedStudent && studentDetail && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to list
            </button>

            {/* Student header */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-5 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl">
                  {studentDetail.student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{studentDetail.student.name}</h3>
                  <div className="text-sm text-slate-600">{studentDetail.student.email} • {studentDetail.student.rollNumber}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {studentDetail.student.college} • {studentDetail.student.department}
                    {studentDetail.student.mentor && ` • Mentor: ${studentDetail.student.mentor}`}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="text-center p-2 rounded-lg bg-white/60"><Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" /><div className="font-black">{studentDetail.student.xp}</div><div className="text-[10px] text-slate-500">XP</div></div>
                <div className="text-center p-2 rounded-lg bg-white/60"><Crown className="w-4 h-4 mx-auto text-purple-500 mb-1" /><div className="font-black">Lvl {studentDetail.student.level}</div><div className="text-[10px] text-slate-500">Level</div></div>
                <div className="text-center p-2 rounded-lg bg-white/60"><Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" /><div className="font-black">{studentDetail.student.streak}</div><div className="text-[10px] text-slate-500">Streak</div></div>
                <div className="text-center p-2 rounded-lg bg-white/60"><Target className="w-4 h-4 mx-auto text-cyan-500 mb-1" /><div className="font-black">{studentDetail.accuracy}%</div><div className="text-[10px] text-slate-500">Accuracy</div></div>
              </div>
            </div>

            {/* Week-wise results */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Brain className="w-4 h-4 text-blue-500" /> Week-wise Practice Results</h4>
              {studentDetail.weekStats.length === 0 ? <div className="text-sm text-slate-400 py-4 text-center">No practice attempts yet</div> :
                <div className="space-y-2">
                  {studentDetail.weekStats.map((ws: any) => {
                    const pct = ws.attempted > 0 ? Math.round((ws.correct / ws.attempted) * 100) : 0;
                    return (
                      <div key={ws.weekNumber} className="flex items-center gap-3">
                        <div className="w-20 text-xs font-bold shrink-0">Week {ws.weekNumber}</div>
                        <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden relative">
                          <div className={`h-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{ws.correct}/{ws.attempted} ({pct}%)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>

            {/* Mock test results */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Target className="w-4 h-4 text-amber-500" /> Mock Test Results</h4>
              {studentDetail.mockAttempts.length === 0 ? <div className="text-sm text-slate-400 py-4 text-center">No mock tests attempted</div> :
                <div className="space-y-2">
                  {studentDetail.mockAttempts.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div>
                        <div className="text-sm font-medium">{m.title}</div>
                        {m.weekNumber && <div className="text-[10px] text-slate-500">Week {m.weekNumber}</div>}
                        <div className="text-[10px] text-slate-400">{new Date(m.completedAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black ${m.percent >= 75 ? "text-emerald-600" : m.percent >= 50 ? "text-amber-600" : "text-red-500"}`}>{m.score}/{m.total}</div>
                        <div className="text-xs text-slate-500">{m.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* Badges */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-pink-500" /> Badges Earned ({studentDetail.badges.length})</h4>
              {studentDetail.badges.length === 0 ? <div className="text-sm text-slate-400 py-4 text-center">No badges yet</div> :
                <div className="flex flex-wrap gap-2">
                  {studentDetail.badges.map((b: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200">
                      <span className="text-lg">{b.icon}</span>
                      <span className="text-xs font-bold">{b.name}</span>
                    </div>
                  ))}
                </div>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { RefreshCw } from "lucide-react";
