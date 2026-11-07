"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, ChevronRight, Building2, GraduationCap, Users,
  Brain, Target, Award, Zap, Flame, Crown, RefreshCw, TrendingUp,
  Folder, FolderOpen
} from "lucide-react";

export function ResultsView({ user, apiBase, onExit }: { user: any; apiBase: string; onExit: () => void }) {
  const isMainAdmin = user.role === "ADMIN";
  const isMentor = user.role === "MENTOR";
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load initial data based on role
  useEffect(() => {
    if (isMentor) {
      // Mentor: load their students directly (no college/mentor drill-down)
      loadMentorStudents();
      return;
    }
    if (!isMainAdmin) {
      // Sub-admin: auto-load their college's mentors
      loadMentors(user.collegeId);
      return;
    }
    loadColleges();
  }, []);

  const loadMentorStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  };

  const loadColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colleges");
      const data = await res.json();
      setColleges(data.colleges || []);
    } finally { setLoading(false); }
  };

  const loadMentors = async (collegeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mentors?collegeId=${collegeId}`);
      const data = await res.json();
      setMentors(data.mentors || []);
    } finally { setLoading(false); }
  };

  const loadStudents = async (mentorId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?mentorId=${mentorId}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  };

  const loadStudentDetail = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?studentId=${studentId}`);
      const data = await res.json();
      if (res.ok) setStudentDetail(data);
    } finally { setLoading(false); }
  };

  const refresh = () => {
    if (selectedStudent) loadStudentDetail(selectedStudent);
    else if (isMentor) loadMentorStudents();
    else if (selectedMentor) loadStudents(selectedMentor.id);
    else if (selectedCollege) loadMentors(selectedCollege.id);
    else if (isMainAdmin) loadColleges();
    else if (user.collegeId) loadMentors(user.collegeId);
  };

  // Breadcrumb
  const goRoot = () => {
    setSelectedCollege(null);
    setSelectedMentor(null);
    setSelectedStudent(null);
    setStudentDetail(null);
    if (isMentor) loadMentorStudents();
  };
  const breadcrumb = (
    <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 flex-wrap">
      <button onClick={goRoot} className="hover:text-purple-600 font-bold text-slate-700">
        <TrendingUp className="w-3.5 h-3.5 inline mr-1" />Results
      </button>
      {selectedCollege && <>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => { setSelectedMentor(null); setSelectedStudent(null); setStudentDetail(null); }} className="hover:text-purple-600 font-bold text-slate-700">
          <Building2 className="w-3.5 h-3.5 inline mr-1" />{selectedCollege.name}
        </button>
      </>}
      {selectedMentor && <>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }} className="hover:text-purple-600 font-bold text-slate-700">
          <GraduationCap className="w-3.5 h-3.5 inline mr-1" />{selectedMentor.name}
        </button>
      </>}
      {selectedStudent && studentDetail && <>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-purple-600"><Users className="w-3.5 h-3.5 inline mr-1" />{studentDetail.student.name}</span>
      </>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-purple-600" /> Results & Analytics
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold flex items-center gap-1.5 hover:bg-slate-200 transition" title="Refresh results">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={onExit} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {breadcrumb}

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>}

      {/* LEVEL 1: College List (main admin only) */}
      {!loading && !selectedCollege && isMainAdmin && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5"><Folder className="w-4 h-4" /> Select a college to view results</div>
          {colleges.map(c => (
            <button key={c.id} onClick={() => { setSelectedCollege(c); loadMentors(c.id); }}
              className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-purple-300 hover:shadow-sm transition flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-base">{c.name}</div>
                <div className="text-xs text-slate-500">{c.location} • Code: {c.code}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {/* LEVEL 1: Mentor List (sub-admin - auto loads their college; mentors skip this) */}
      {!loading && !selectedCollege && !isMainAdmin && !isMentor && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5"><Folder className="w-4 h-4" /> Mentors in {user.college?.name}</div>
          {mentors.length === 0 ? <div className="text-center py-8 text-slate-400">No mentors in this college</div> :
            mentors.map(m => (
              <button key={m.id} onClick={() => { setSelectedMentor(m); loadStudents(m.id); }}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.department?.name || "No dept"} • {m._count?.students || 0} students</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))
          }
        </div>
      )}

      {/* LEVEL 1 (mentor): Student List - mentor sees their students directly */}
      {!loading && !selectedStudent && isMentor && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> My Students <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">{students.length}</span></div>
          {students.length === 0 ? <div className="text-center py-8 text-slate-400">No students assigned to you</div> :
            students.map((s) => (
              <button key={s.id} onClick={() => { setSelectedStudent(s.id); loadStudentDetail(s.id); }}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-3 hover:border-purple-300 hover:shadow-sm transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm flex items-center gap-2">{s.name}
                        {s.rollNumber && <span className="text-xs text-slate-500">{s.rollNumber}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{s.department?.code} • {s.email}</div>
                    </div>
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
            ))
          }
        </div>
      )}

      {/* LEVEL 2: Mentor List (inside college) */}
      {!loading && selectedCollege && !selectedMentor && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> Mentors in {selectedCollege.name}</div>
          {mentors.length === 0 ? <div className="text-center py-8 text-slate-400">No mentors in this college</div> :
            mentors.map(m => (
              <button key={m.id} onClick={() => { setSelectedMentor(m); loadStudents(m.id); }}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.department?.name || "No dept"} • {m._count?.students || 0} students</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))
          }
        </div>
      )}

      {/* LEVEL 3: Student List (inside mentor) */}
      {!loading && selectedMentor && !selectedStudent && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> Students under {selectedMentor.name}</div>
          {students.length === 0 ? <div className="text-center py-8 text-slate-400">No students assigned to this mentor</div> :
            students.map((s, i) => (
              <button key={s.id} onClick={() => { setSelectedStudent(s.id); loadStudentDetail(s.id); }}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-3 hover:border-purple-300 hover:shadow-sm transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm flex items-center gap-2">{s.name}
                        {s.rollNumber && <span className="text-xs text-slate-500">{s.rollNumber}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{s.department?.code} • {s.email}</div>
                    </div>
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
            ))
          }
        </div>
      )}

      {/* LEVEL 4: Student Detail Results */}
      {!loading && selectedStudent && studentDetail && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
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
    </div>
  );
}
