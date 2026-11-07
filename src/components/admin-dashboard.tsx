"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, LogOut, Building2, Users, GraduationCap, Layers, Download,
  TrendingUp, Activity, Award, BarChart3, Plus, Trash2, Shield, Eye,
  Crown, Zap, Target, Brain, ChevronDown, ChevronLeft, ChevronRight,
  Filter, RefreshCw, UserCog, KeyRound,
  UserCheck, AlertCircle, Pencil, X, Folder, FolderOpen, Flame,
  Globe, MessageCircle
} from "lucide-react";
import { RealtimeActivityFeed } from "@/components/realtime/realtime-activity-feed";
import { AnnouncementsManager } from "@/components/realtime/announcements";
import { MockTestPlayer } from "@/components/mock-test-player";
import { ResultsView } from "@/components/results-view";
import { cleanupUserFirestore } from "@/lib/firestore";
import { ChatView } from "@/components/realtime/chat-view";
import { RealtimeLeaderboard } from "@/components/realtime/realtime-leaderboard";
import { StudentPreview } from "@/components/realtime/student-preview";
import { DummyStudentPreview } from "@/components/realtime/dummy-student-preview";

type Tab = "overview" | "colleges" | "departments" | "mentors" | "students" | "sub-admins" | "exports" | "mock-tests" | "results" | "leaderboard" | "chat";

export function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  const isMainAdmin = user.role === "ADMIN";
  const isSubAdmin = user.role === "SUB_ADMIN";

  const loadColleges = useCallback(async () => {
    const res = await fetch("/api/admin/colleges");
    const data = await res.json();
    setColleges(data.colleges || []);
    // Sub-admins are scoped to their college
    if (isSubAdmin && user.collegeId) {
      setSelectedCollegeId(user.collegeId);
    }
  }, [isSubAdmin, user.collegeId]);

  useEffect(() => { loadColleges(); }, [loadColleges]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  // Tabs differ for main admin vs sub-admin
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    ...(isMainAdmin ? [{ key: "colleges" as Tab, label: "Colleges", icon: Building2 }] : []),
    ...(isMainAdmin ? [{ key: "sub-admins" as Tab, label: "Sub-Admins", icon: UserCheck }] : []),
    { key: "departments", label: "Departments", icon: Layers },
    { key: "mentors", label: "Mentors", icon: GraduationCap },
    { key: "students", label: "Students", icon: Users },
    { key: "leaderboard", label: "Leaderboard", icon: Crown },
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "exports", label: "Export Data", icon: Download },
    { key: "mock-tests", label: "Test Mock Tests", icon: Target },
    { key: "results", label: "Results", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
              <img src="/logo-48.png" alt="Constitution Quest" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-lg leading-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-xs text-slate-500 leading-tight">
                {isMainAdmin ? "Main Admin Control Panel" : `Sub-Admin Panel • ${user.college?.name || ""}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStudentPreview(true)}
              className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-bold flex items-center gap-2 transition"
              title="Preview what students see"
            >
              <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Student Preview</span>
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isMainAdmin ? "bg-purple-50 border-purple-200" : "bg-emerald-50 border-emerald-200"}`}>
              <Shield className={`w-4 h-4 ${isMainAdmin ? "text-purple-600" : "text-emerald-600"}`} />
              <span className={`text-sm font-bold ${isMainAdmin ? "text-purple-700" : "text-emerald-700"}`}>{user.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isMainAdmin ? "bg-purple-200 text-purple-800" : "bg-emerald-200 text-emerald-800"}`}>
                {isMainAdmin ? "MAIN" : "SUB"}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 hover:text-red-600 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                    active ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {/* College filter for relevant tabs — only main admin can filter; sub-admin is auto-scoped */}
        {(tab === "departments" || tab === "mentors" || tab === "exports") && isMainAdmin && (
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Filter by college:</span>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Colleges</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {isSubAdmin && (tab === "departments" || tab === "mentors" || tab === "exports") && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <Shield className="w-4 h-4 inline mr-2" />
            You are scoped to <strong>{user.college?.name}</strong>. All data shown is for your assigned college only.
          </div>
        )}

        {tab === "overview" && <OverviewTab isMainAdmin={isMainAdmin} user={user} />}
        {tab === "colleges" && isMainAdmin && <CollegesTab colleges={colleges} onRefresh={loadColleges} />}
        {tab === "sub-admins" && isMainAdmin && <SubAdminsTab />}
        {tab === "departments" && <DepartmentsTab collegeId={selectedCollegeId} colleges={colleges} isSubAdmin={isSubAdmin} />}
        {tab === "mentors" && <MentorsTab collegeId={selectedCollegeId} colleges={colleges} isSubAdmin={isSubAdmin} />}
        {tab === "students" && <StudentsTab user={user} colleges={colleges} isMainAdmin={isMainAdmin} isSubAdmin={isSubAdmin} />}
        {tab === "leaderboard" && <LeaderboardTab user={user} colleges={colleges} isMainAdmin={isMainAdmin} isSubAdmin={isSubAdmin} />}
        {tab === "chat" && <ChatTab user={user} colleges={colleges} isMainAdmin={isMainAdmin} isSubAdmin={isSubAdmin} />}
        {tab === "exports" && <ExportsTab collegeId={selectedCollegeId} />}
        {tab === "mock-tests" && <MockTestPlayer user={user} onExit={() => setTab("overview")} />}
        {tab === "results" && <ResultsView user={user} apiBase="/api/admin/results" onExit={() => setTab("overview")} />}
      </main>

      {/* Student Preview overlay */}
      {showStudentPreview && (
        <StudentPreview user={user} onClose={() => setShowStudentPreview(false)} />
      )}
    </div>
  );
}

// ============== OVERVIEW ==============
function OverviewTab({ isMainAdmin, user }: { isMainAdmin: boolean; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = collegeFilter ? `/api/admin/stats?collegeId=${collegeFilter}` : "/api/admin/stats";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }, [collegeFilter]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // Also refresh when the tab becomes visible again
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [load]);

  async function seedQuestions() {
    if (!confirm("This will import ~200 practice questions and 8 mock tests across 8 weeks of the Constitution of India course. Existing questions will NOT be duplicated. Proceed?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-questions", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Questions seeded successfully!");
        load(); // refresh stats
      } else {
        toast.error(data.error || "Failed to seed questions");
      }
    } catch (e) {
      toast.error("Network error while seeding");
    } finally { setSeeding(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  // Defensive: handle missing or malformed stats
  if (!stats || !stats.counts) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-3">Failed to load stats. Please try again.</p>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold">Retry</button>
      </div>
    );
  }

  const c = stats.counts;
  const collegeStats = stats.collegeStats || [];
  const topStudents = stats.topStudents || [];
  const recentActivity = stats.recentActivity || [];
  const mockAttempts = stats.mockAttempts || [];
  return (
    <div className="space-y-6">
      {/* Seed Questions banner — main admin only */}
      {isMainAdmin && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 flex items-start gap-3">
          <Brain className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-amber-800 text-sm">Import Course Questions</div>
            <div className="text-xs text-amber-700 mt-0.5">
              One-click import of ~200 practice questions + 8 mock tests covering the full 8-week Constitution of India course (citizenship, fundamental rights, Parliament, President, state government, local governance, judiciary, PIL & judicial review).
            </div>
          </div>
          <button
            onClick={seedQuestions}
            disabled={seeding}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60 shrink-0"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {seeding ? "Importing..." : "Import Questions"}
          </button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black">{isMainAdmin ? "Platform Overview" : "College Overview"}</h2>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isMainAdmin && (
            <select value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">All Colleges</option>
              {collegeStats.map((cs: any) => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
            </select>
          )}
          <button onClick={() => load()} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Refresh now"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatBox icon={Building2} label="Colleges" value={c.colleges} color="bg-purple-50 text-purple-600 border-purple-200" />
        <StatBox icon={Layers} label="Departments" value={c.departments} color="bg-blue-50 text-blue-600 border-blue-200" />
        <StatBox icon={GraduationCap} label="Mentors" value={c.mentors} color="bg-emerald-50 text-emerald-600 border-emerald-200" />
        <StatBox icon={Users} label="Students" value={c.students} color="bg-amber-50 text-amber-600 border-amber-200" />
        <StatBox icon={Brain} label="Questions" value={c.questions} color="bg-pink-50 text-pink-600 border-pink-200" />
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatBox icon={Activity} label="Total Logins" value={c.totalLogins} color="bg-violet-50 text-violet-600 border-violet-200" />
        <StatBox icon={Target} label="Practice Attempts" value={c.totalPractice} color="bg-cyan-50 text-cyan-600 border-cyan-200" />
        <StatBox icon={Award} label="Mock Tests Taken" value={c.totalMock} color="bg-orange-50 text-orange-600 border-orange-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top students */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" /> Top 10 Students (by XP)</h3>
          <div className="space-y-2">
            {topStudents.length === 0 ? <div className="text-sm text-slate-400 py-6 text-center">No students yet</div> :
              topStudents.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300" : i === 2 ? "bg-orange-300" : "bg-slate-100"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.college?.code} • {s.department?.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600 flex items-center gap-1 text-sm justify-end"><Zap className="w-3 h-3" />{s.xp}</div>
                    <div className="text-xs text-slate-400">Lvl {s.level} • 🔥{s.streak}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* College breakdown */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-500" /> {isMainAdmin ? "College Breakdown" : "My College"}</h3>
          <div className="space-y-2">
            {collegeStats.length === 0 ? <div className="text-sm text-slate-400 py-6 text-center">No data</div> :
              collegeStats.map((cs: any) => (
                <div key={cs.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{cs.name}</div>
                      <div className="text-xs text-slate-500">{cs.location}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">{cs.code}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><div className="text-base font-black text-purple-600">{cs.students}</div><div className="text-[10px] text-slate-500 uppercase">Students</div></div>
                    <div><div className="text-base font-black text-emerald-600">{cs.mentors}</div><div className="text-[10px] text-slate-500 uppercase">Mentors</div></div>
                    <div><div className="text-base font-black text-cyan-600">{cs.practiceAttempts}</div><div className="text-[10px] text-slate-500 uppercase">Practice</div></div>
                    <div><div className="text-base font-black text-amber-600">{cs.mockAttempts}</div><div className="text-[10px] text-slate-500 uppercase">Mocks</div></div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Recent Activity (Last 50)</h3>
        <div className="max-h-80 overflow-y-auto cq-scroll">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">User</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">College</th>
                <th className="py-2 pr-2">Action</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400">No recent activity</td></tr>
              ) : recentActivity.map((a: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 pr-2 whitespace-nowrap text-slate-400">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-2 font-medium">{a.user?.name || "—"}</td>
                  <td className="py-2 pr-2"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase">{a.user?.role || "—"}</span></td>
                  <td className="py-2 pr-2 text-slate-500">{a.user?.college?.code || "—"}</td>
                  <td className="py-2 pr-2"><code className="text-purple-600">{a.action}</code></td>
                  <td className="py-2 text-slate-500 truncate max-w-xs">{a.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Activity Feed + Announcements (Firestore) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeActivityFeed scope={isMainAdmin ? "global" : "college"} collegeCode={isMainAdmin ? null : (user?.college?.code || null)} />
        <AnnouncementsManager user={user} collegeId={user?.collegeId || null} />
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: any) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

// ============== LEADERBOARD SETTINGS ==============
// Unified control panel for leaderboard visibility. Visible to BOTH main admin
// and sub-admin (sub-admin is scoped to their own college).
//   - College leaderboard toggle: main admin sees all colleges; sub-admin sees
//     only their college.
//   - Department leaderboard toggles: departments in scope (sub-admin scoped to
//     their college). Each can be locked/unlocked independently.
//   - Mentors can also toggle their OWN department's leaderboard from their
//     profile modal, so the admin panel notes that.
function LeaderboardTab({ user, colleges, isMainAdmin, isSubAdmin }: any) {
  const [collegeVis, setCollegeVis] = useState<Record<string, boolean>>({});
  const [deptVis, setDeptVis] = useState<Record<string, boolean>>({});
  // Per-department override: can students in THIS department see the COLLEGE leaderboard?
  const [collegeForDeptVis, setCollegeForDeptVis] = useState<Record<string, boolean>>({});
  const [collegeLockedVis, setCollegeLockedVis] = useState<Record<string, boolean>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  // Refresh key — incremented after each toggle to force the preview to re-fetch
  const [previewKey, setPreviewKey] = useState(0);

  // Colleges in scope: all for main admin, just the sub-admin's college.
  const scopedColleges = isSubAdmin
    ? colleges.filter((c: any) => c.id === user.collegeId)
    : colleges;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch visibility settings (college + department + college-for-dept maps)
      const [sRes, dRes] = await Promise.all([
        fetch("/api/admin/leaderboard-settings"),
        fetch(`/api/admin/departments${isSubAdmin ? `?collegeId=${user.collegeId}` : ""}`),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        setCollegeVis(sData.college || {});
        setDeptVis(sData.department || {});
        setCollegeForDeptVis(sData.collegeForDept || {});
        setCollegeLockedVis(sData.collegeLocked || {});
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
    } finally { setLoading(false); }
  }, [isSubAdmin, user.collegeId]);

  useEffect(() => { load(); }, [load]);

  // Live updates: listen for localStorage events from other tabs/windows
  // instead of polling. When mentor toggles in another tab, it writes a
  // signal to localStorage which triggers a refresh here.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "lb-updated" || e.key === "chat-updated") {
        load();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [load]);

  // Detect whether the Setting table exists by attempting a no-op read.
  // We probe via the leaderboard-settings endpoint: if it returns an empty
  // object without error, the table exists (or is correctly defaulted). The
  // real test happens on first toggle — if it fails with "Setting", we set
  // tableMissing=true. We also probe proactively here so the banner shows
  // before the admin tries to toggle.
  useEffect(() => {
    (async () => {
      try {
        // A lightweight probe: try to upsert a harmless test key and immediately
        // delete it. If the table is missing, this throws.
        // We only do this for main admin (who can create the table).
        if (isMainAdmin) {
          const res = await fetch("/api/admin/leaderboard-settings");
          if (res.ok) {
            const data = await res.json();
            // If the endpoint returned successfully but we want to verify the
            // table actually exists (not just defaulted), we check by looking
            // at whether any keys are present OR by attempting a toggle probe.
            // Simpler: leave tableMissing=false until a toggle fails.
          }
        }
      } catch { /* ignore */ }
    })();
  }, [isMainAdmin]);

  async function createSettingsTable() {
    setCreatingTable(true);
    try {
      const res = await fetch("/api/admin/setup-settings-table", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTableMissing(false);
        toast.success("Settings table created! Toggles will work now.");
        await load();
      } else {
        toast.error(data.error || "Failed to create table");
      }
    } finally { setCreatingTable(false); }
  }

  async function toggleCollege(collegeId: string) {
    const current = collegeVis[collegeId] !== false;
    const next = !current;
    setTogglingId(`college-${collegeId}`);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collegeId, leaderboardVisible: next }),
      });
      if (res.ok) {
        setCollegeVis(prev => ({ ...prev, [collegeId]: next }));
        setTableMissing(false);
        toast.success(`College leaderboard ${next ? "ENABLED" : "DISABLED"}.`);
        setPreviewKey(k => k + 1); // refresh preview
        localStorage.setItem("lb-updated", String(Date.now())); // signal other tabs
      } else {
        const d = await res.json().catch(() => ({}));
        if (d.error && d.error.includes("Setting")) setTableMissing(true);
        toast.error(d.error || "Failed", {
          description: d.error && d.error.includes("Setting") ? "Run `npm run db:push` to create the settings table." : undefined,
        });
      }
    } finally { setTogglingId(null); }
  }

  // Lock/unlock the college LB — when locked, mentors can't toggle it
  async function toggleCollegeLock(collegeId: string) {
    const current = collegeLockedVis[collegeId] === true;
    const next = !current;
    setTogglingId(`collegeLock-${collegeId}`);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collegeId, leaderboardLocked: next }),
      });
      if (res.ok) {
        setCollegeLockedVis(prev => ({ ...prev, [collegeId]: next }));
        setTableMissing(false);
        toast.success(`College leaderboard ${next ? "LOCKED 🔒" : "UNLOCKED 🔓"}. ${next ? "Mentors can no longer toggle it." : "Mentors can now toggle it."}`);
        setPreviewKey(k => k + 1);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to toggle lock");
      }
    } finally { setTogglingId(null); }
  }

  async function toggleDept(deptId: string) {
    const current = deptVis[deptId] !== false;
    const next = !current;
    setTogglingId(`dept-${deptId}`);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deptId, leaderboardVisible: next }),
      });
      if (res.ok) {
        setDeptVis(prev => ({ ...prev, [deptId]: next }));
        setTableMissing(false);
        toast.success(`Department leaderboard ${next ? "ENABLED" : "DISABLED"}.`);
        setPreviewKey(k => k + 1); // refresh preview
        localStorage.setItem("lb-updated", String(Date.now())); // signal other tabs
      } else {
        const d = await res.json().catch(() => ({}));
        if (d.error && d.error.includes("Setting")) setTableMissing(true);
        toast.error(d.error || "Failed", {
          description: d.error && d.error.includes("Setting") ? "Run `npm run db:push` to create the settings table." : undefined,
        });
      }
    } finally { setTogglingId(null); }
  }

  // Toggle whether students in THIS department can see the COLLEGE leaderboard.
  // This is a per-department override on top of the college-wide toggle.
  async function toggleCollegeForDept(deptId: string) {
    const current = collegeForDeptVis[deptId] !== false;
    const next = !current;
    setTogglingId(`cfd-${deptId}`);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deptId, collegeLeaderboardVisibleForDept: next }),
      });
      if (res.ok) {
        setCollegeForDeptVis(prev => ({ ...prev, [deptId]: next }));
        setTableMissing(false);
        toast.success(`College leaderboard for this department ${next ? "ENABLED" : "DISABLED"}.`);
        setPreviewKey(k => k + 1); // refresh preview
        localStorage.setItem("lb-updated", String(Date.now())); // signal other tabs
      } else {
        const d = await res.json().catch(() => ({}));
        if (d.error && d.error.includes("Setting")) setTableMissing(true);
        toast.error(d.error || "Failed", {
          description: d.error && d.error.includes("Setting") ? "Run `npm run db:push` to create the settings table." : undefined,
        });
      }
    } finally { setTogglingId(null); }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* DUMMY STUDENT PREVIEW — visual mockup of what students see */}
      <DummyStudentPreview type="leaderboard" previewKey={previewKey} />

      {/* Header + warning if Setting table missing */}
      <div>
        <h2 className="text-2xl font-black flex items-center gap-2"><Crown className="w-6 h-6 text-amber-500" /> Leaderboard Visibility</h2>
        <p className="text-slate-500 text-sm mt-1">
          Lock or unlock the student leaderboard. When a college or department is locked, students in it see a
          &ldquo;Leaderboard is currently disabled&rdquo; message instead of rankings.
        </p>
      </div>

      {tableMissing && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-red-700 text-sm">Settings table is missing</div>
            <div className="text-xs text-red-600 mt-1">
              The toggles can&apos;t save until the <code className="bg-red-100 px-1 rounded">Setting</code> table exists in your database.
              {isMainAdmin
                ? " You can create it right now by clicking the button below (no CLI needed)."
                : " Please ask the main admin to create it."}
            </div>
            {isMainAdmin && (
              <button
                onClick={createSettingsTable}
                disabled={creatingTable}
                className="mt-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {creatingTable ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Settings Table Now
              </button>
            )}
            <div className="text-[11px] text-red-500 mt-2">
              Non-destructive — only adds the new table, existing data is untouched. Or run <code className="bg-red-100 px-1 rounded">npm run db:push</code> locally.
            </div>
          </div>
        </div>
      )}

      {/* College-level toggles */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-500" /> College Leaderboard</h3>
        <p className="text-xs text-slate-500 mb-4">
          {isMainAdmin
            ? "Toggle the 'My College' leaderboard tab for all students in each college."
            : "Toggle the 'My College' leaderboard tab for students in your college."}
        </p>
        {scopedColleges.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No colleges in scope.</p>
        ) : (
          <div className="space-y-2">
            {scopedColleges.map((c: any) => {
              const visible = collegeVis[c.id] !== false;
              const locked = collegeLockedVis[c.id] === true;
              return (
                <div key={c.id} className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        {c.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">{c.code}</span>
                        {locked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">🔒 LOCKED</span>}
                      </div>
                      <div className="text-xs text-slate-500">{visible ? "Students can see the college leaderboard" : "Hidden from students"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleCollege(c.id)}
                        disabled={togglingId === `college-${c.id}`}
                        className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${visible ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                      >
                        {togglingId === `college-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                        {visible ? "ON" : "OFF"}
                      </button>
                      <button
                        onClick={() => toggleCollegeLock(c.id)}
                        disabled={togglingId === `collegeLock-${c.id}`}
                        title={locked ? "Unlock — mentors can toggle again" : "Lock — mentors can't toggle"}
                        className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${locked ? "bg-red-50 border-red-300 text-red-700" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                      >
                        {togglingId === `collegeLock-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                        {locked ? "Locked" : "Lock"}
                      </button>
                    </div>
                  </div>
                  {locked && <div className="text-[10px] text-red-500 pl-1">🔒 Mentors cannot toggle the college leaderboard for this college</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Department-level toggles — Dept LB + College LB per department */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Department Leaderboards</h3>
        <p className="text-xs text-slate-500 mb-4">
          Each department has TWO toggles:
          <span className="font-bold text-blue-600"> Dept LB</span> = the &ldquo;My Department&rdquo; tab for that department&apos;s students;
          <span className="font-bold text-purple-600"> College LB</span> = whether THAT department&apos;s students can see the &ldquo;My College&rdquo; tab (per-department override).
          Mentors can also toggle their OWN department from their profile modal.
        </p>
        {departments.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No departments in scope.</p>
        ) : (
          <div className="space-y-2">
            {departments.map((d: any) => {
              const deptLbOn = deptVis[d.id] !== false;
              const collegeLbForDeptOn = collegeForDeptVis[d.id] !== false;
              return (
                <div key={d.id} className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        {d.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">{d.code}</span>
                      </div>
                      <div className="text-xs text-slate-500">{d.college?.name || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleDept(d.id)}
                        disabled={togglingId === `dept-${d.id}`}
                        title="Department leaderboard (My Department tab)"
                        className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${deptLbOn ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                      >
                        {togglingId === `dept-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                        Dept LB {deptLbOn ? "ON" : "OFF"}
                      </button>
                      <button
                        onClick={() => toggleCollegeForDept(d.id)}
                        disabled={togglingId === `cfd-${d.id}`}
                        title="College LB for this department only (per-department override)"
                        className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${collegeLbForDeptOn ? "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                      >
                        {togglingId === `cfd-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
                        College LB {collegeLbForDeptOn ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============== CHAT ==============
// Admin chat tab: visibility toggles + the chat view itself.
// Admins can toggle: global chat, college chat (per college), dept chat
// (per dept), mentor chat (per college). Sub-admins scoped to their college.
function ChatTab({ user, colleges, isMainAdmin, isSubAdmin }: any) {
  const [settings, setSettings] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Refresh key — incremented after each toggle to force the preview to re-fetch
  const [previewKey, setPreviewKey] = useState(0);

  const scopedColleges = isSubAdmin
    ? colleges.filter((c: any) => c.id === user.collegeId)
    : colleges;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch("/api/admin/chat-settings"),
        fetch(`/api/admin/departments${isSubAdmin ? `?collegeId=${user.collegeId}` : ""}`),
      ]);
      if (sRes.ok) setSettings(await sRes.json());
      if (dRes.ok) { const d = await dRes.json(); setDepartments(d.departments || []); }
    } finally { setLoading(false); }
  }, [isSubAdmin, user.collegeId]);

  useEffect(() => { load(); }, [load]);

  async function toggle(scope: string, id: string | undefined, current: boolean) {
    const next = !current;
    const key = `${scope}-${id || "global"}`;
    setTogglingKey(key);
    try {
      const res = await fetch("/api/admin/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, id, visible: next }),
      });
      if (res.ok) {
        toast.success(`Chat ${next ? "ENABLED" : "DISABLED"}.`);
        await load();
        setPreviewKey(k => k + 1); // refresh preview
        localStorage.setItem("chat-updated", String(Date.now())); // signal other tabs
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed");
      }
    } finally { setTogglingKey(null); }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  const globalOn = settings.global?.global !== false;
  const collegeMap = settings.college || {};
  const deptMap = settings.dept || {};
  const mentorMap = settings.mentor || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6" style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", padding: "1.5rem", borderRadius: "1rem", minHeight: "80vh" }}>
      {/* DUMMY STUDENT PREVIEW — visual mockup of what students see */}
      <DummyStudentPreview type="chat" previewKey={previewKey} />

      <div>
        <h2 className="text-2xl font-black flex items-center gap-2 text-white"><MessageCircle className="w-6 h-6 text-cyan-400" /> Chat Controls</h2>
        <p className="text-white/50 text-sm mt-1">
          Toggle chat channels on or off. Messages auto-delete after 24 hours.
          Mentors can additionally control their own department&apos;s chat from their profile.
        </p>
      </div>

      {/* Global chat toggle */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Globe className="w-4 h-4 text-blue-400" /> Global Chat</h3>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div>
            <div className="font-bold text-sm text-white">Global chat {globalOn ? "is ON" : "is OFF"}</div>
            <div className="text-xs text-white/50">All users across all colleges can chat together.</div>
          </div>
          <button
            onClick={() => toggle("global", undefined, globalOn)}
            disabled={togglingKey === "global-global"}
            className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${globalOn ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
          >
            {togglingKey === "global-global" ? <Loader2 className="w-3 h-3 animate-spin" /> : globalOn ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* College chat toggles */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><Building2 className="w-4 h-4 text-purple-400" /> College Chats</h3>
        <div className="space-y-2">
          {scopedColleges.map((c: any) => {
            const on = collegeMap[c.id] !== false;
            return (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-sm flex items-center gap-2 text-white">{c.name} <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{c.code}</span></div>
                <button
                  onClick={() => toggle("college", c.id, on)}
                  disabled={togglingKey === `college-${c.id}`}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${on ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
                >
                  {togglingKey === `college-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : on ? "ON" : "OFF"}
                </button>
              </div>
            );
          })}
          {scopedColleges.length === 0 && <p className="text-sm text-white/40 text-center py-4">No colleges in scope.</p>}
        </div>
      </div>

      {/* Department chat toggles — 3 per department: dept, dept-students, dm */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="font-bold mb-1 flex items-center gap-2 text-white"><Layers className="w-4 h-4 text-blue-400" /> Department Chats</h3>
        <p className="text-xs text-white/50 mb-4">
          Each department has 3 chat toggles:
          <span className="font-bold text-blue-400"> Dept</span> (students + mentor),
          <span className="font-bold text-cyan-400"> Students-Only</span> (no mentor),
          <span className="font-bold text-purple-400"> DM</span> (private 1:1).
        </p>
        <div className="space-y-2">
          {departments.map((d: any) => {
            const deptOn = deptMap[d.id] !== false;
            const studentsOn = (settings.deptStudents || {})[d.id] !== false;
            const dmOn = (settings.dm || {})[d.id] !== false;
            return (
              <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm">
                  <span className="font-bold text-white">{d.name}</span>
                  <span className="text-xs text-white/50 ml-2">{d.college?.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Dept chat (students + mentor) */}
                  <button
                    onClick={() => toggle("dept", d.id, deptOn)}
                    disabled={togglingKey === `dept-${d.id}`}
                    title="Department chat (students + mentor)"
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 ${deptOn ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
                  >
                    {togglingKey === `dept-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                    Dept {deptOn ? "ON" : "OFF"}
                  </button>
                  {/* Students-only chat (no mentor) */}
                  <button
                    onClick={() => toggle("dept-students", d.id, studentsOn)}
                    disabled={togglingKey === `dept-students-${d.id}`}
                    title="Students-only chat (no mentor/admin)"
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 ${studentsOn ? "bg-cyan-500/20 border-cyan-400/30 text-cyan-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
                  >
                    {togglingKey === `dept-students-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                    Students-Only {studentsOn ? "ON" : "OFF"}
                  </button>
                  {/* DM (private 1:1) */}
                  <button
                    onClick={() => toggle("dm", d.id, dmOn)}
                    disabled={togglingKey === `dm-${d.id}`}
                    title="Private 1:1 direct messages within department"
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 ${dmOn ? "bg-purple-500/20 border-purple-400/30 text-purple-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
                  >
                    {togglingKey === `dm-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                    DM {dmOn ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            );
          })}
          {departments.length === 0 && <p className="text-sm text-white/40 text-center py-4">No departments in scope.</p>}
        </div>
      </div>

      {/* Mentor chat toggles */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><GraduationCap className="w-4 h-4 text-emerald-400" /> Mentor Chats</h3>
        <div className="space-y-2">
          {scopedColleges.map((c: any) => {
            const on = mentorMap[c.id] !== false;
            return (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold text-sm text-white">{c.name} — Mentors Only</div>
                <button
                  onClick={() => toggle("mentor", c.id, on)}
                  disabled={togglingKey === `mentor-${c.id}`}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${on ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/50"} disabled:opacity-50`}
                >
                  {togglingKey === `mentor-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : on ? "ON" : "OFF"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* The chat view itself — dark background to match chat panel theme */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <h3 className="font-bold mb-3 flex items-center gap-2 text-white"><MessageCircle className="w-4 h-4 text-cyan-400" /> Chat</h3>
        <ChatView user={user} />
      </div>
    </div>
  );
}

// ============== COLLEGES ==============
function CollegesTab({ colleges, onRefresh }: any) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  // Leaderboard visibility settings: { [collegeId]: boolean }
  const [lbVis, setLbVis] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/leaderboard-settings");
        if (res.ok) {
          const data = await res.json();
          setLbVis(data.college || {});
        }
      } catch (e) { console.warn("Failed to load leaderboard settings:", e); }
    })();
  }, []);

  async function toggleLbVisible(collegeId: string) {
    const current = lbVis[collegeId] !== false; // default true if absent
    const next = !current;
    setTogglingId(collegeId);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collegeId, leaderboardVisible: next }),
      });
      if (res.ok) {
        setLbVis(prev => ({ ...prev, [collegeId]: next }));
        toast.success(`College leaderboard ${next ? "ENABLED" : "DISABLED"} for students.`);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to toggle visibility", {
          description: d.error && d.error.includes("Setting")
            ? "Run `npm run db:push` to create the settings table."
            : undefined,
        });
      }
    } catch (e) {
      toast.error("Network error while toggling visibility");
    } finally { setTogglingId(null); }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, location }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("College added!");
      setName(""); setCode(""); setLocation("");
      onRefresh();
    } finally { setLoading(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"?\n\nThis will permanently remove the college. You can only delete a college that has no departments and no users (mentors, students, or sub-admins).`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/colleges?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete college");
        return;
      }
      toast.success("College deleted");
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, name: editing.name, code: editing.code, location: editing.location }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("College updated!");
      setEditing(null);
      onRefresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Leaderboard visibility explainer banner (full width) */}
      <div className="lg:col-span-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 flex items-start gap-3">
        <Crown className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-bold text-amber-800 text-sm">Leaderboard Visibility Controls</div>
          <div className="text-xs text-amber-700 mt-0.5">
            Each college row has an <span className="font-bold">"LB Visible / LB Hidden"</span> button.
            Click it to lock or unlock the college leaderboard for students.
            When hidden, students in that college will see a "Leaderboard is currently disabled" message
            instead of the rankings. Department-level controls are on the Departments tab.
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sticky top-32">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-purple-500" /> Add New College</h3>
          <form onSubmit={add} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">College Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., IES College of Engineering" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Code (unique)</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., IES" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Location (optional)</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="City, State" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add College</>}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3">Each college has its own departments, mentors and students. As the main admin, you can add and manage all colleges.</p>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        <h3 className="font-bold">Colleges ({colleges.length})</h3>
        {colleges.length === 0 ? <div className="text-center py-12 text-slate-400">No colleges yet</div> :
          colleges.map(c => {
            const hasUsers = c._count.users > 0;
            const hasDepts = c._count.departments > 0;
            const canDelete = !hasUsers && !hasDepts;
            return (
              <div key={c.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold flex items-center gap-2 flex-wrap">
                    {c.name}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">{c.code}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.location || "No location"}</div>
                  {(hasUsers || hasDepts) && (
                    <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Cannot delete: {hasDepts && `${c._count.departments} dept(s)`}{hasDepts && hasUsers && ", "}{hasUsers && `${c._count.users} user(s)`} assigned
                    </div>
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  <div className="flex gap-4 text-center mr-2">
                    <div><div className="font-black text-purple-600">{c._count.departments}</div><div className="text-[10px] text-slate-500 uppercase">Depts</div></div>
                    <div><div className="font-black text-amber-600">{c._count.users}</div><div className="text-[10px] text-slate-500 uppercase">Users</div></div>
                  </div>
                  <button
                    onClick={() => toggleLbVisible(c.id)}
                    disabled={togglingId === c.id}
                    title={lbVis[c.id] !== false ? "Leaderboard visible to students — click to HIDE" : "Leaderboard hidden from students — click to SHOW"}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${lbVis[c.id] !== false ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {togglingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                    {lbVis[c.id] !== false ? "LB Visible" : "LB Hidden"}
                  </button>
                  <button
                    onClick={() => setEditing({ ...c })}
                    title="Edit college"
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => del(c.id, c.name)}
                    disabled={!canDelete || deletingId === c.id}
                    title={canDelete ? "Delete college" : "Delete all departments and users first"}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditModal title="Edit College" onClose={() => setEditing(null)} onSave={saveEdit} loading={loading}>
          <div>
            <label className="text-xs font-bold text-slate-600">College Name</label>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Code (unique)</label>
            <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Location</label>
            <input value={editing.location || ""} onChange={e => setEditing({ ...editing, location: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="City, State" />
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ============== DEPARTMENTS ==============
function DepartmentsTab({ collegeId, colleges, isSubAdmin }: any) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  // For sub-admins, lock the college to their assigned college
  const [selectedCollege, setSelectedCollege] = useState(isSubAdmin ? collegeId : (colleges[0]?.id || ""));
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  // Department leaderboard visibility: { [departmentId]: boolean }
  const [lbVis, setLbVis] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/leaderboard-settings");
        if (res.ok) {
          const data = await res.json();
          setLbVis(data.department || {});
        }
      } catch (e) { console.warn("Failed to load dept leaderboard settings:", e); }
    })();
  }, []);

  async function toggleLbVisible(deptId: string) {
    const current = lbVis[deptId] !== false;
    const next = !current;
    setTogglingId(deptId);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deptId, leaderboardVisible: next }),
      });
      if (res.ok) {
        setLbVis(prev => ({ ...prev, [deptId]: next }));
        toast.success(`Department leaderboard ${next ? "ENABLED" : "DISABLED"} for students.`);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to toggle visibility", {
          description: d.error && d.error.includes("Setting")
            ? "Run `npm run db:push` to create the settings table."
            : undefined,
        });
      }
    } catch (e) {
      toast.error("Network error while toggling visibility");
    } finally { setTogglingId(null); }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Sub-admins are auto-scoped server-side; main admin passes collegeId
      const url = collegeId || isSubAdmin ? `/api/admin/departments?collegeId=${collegeId}` : "/api/admin/departments";
      const res = await fetch(url);
      const data = await res.json();
      setDepartments(data.departments || []);
    } finally { setLoading(false); }
  }, [collegeId, isSubAdmin]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (colleges.length > 0 && !selectedCollege) setSelectedCollege(colleges[0].id); }, [colleges, selectedCollege]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code || !selectedCollege) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, collegeId: selectedCollege }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Department added!");
      setName(""); setCode("");
      load();
    } finally { setSubmitting(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this department?")) return;
    const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
    else { const d = await res.json(); toast.error(d.error); }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, name: editing.name, code: editing.code }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Department updated!");
      setEditing(null);
      load();
    } finally { setEditLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Leaderboard visibility explainer banner (full width) */}
      <div className="lg:col-span-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 flex items-start gap-3">
        <Crown className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-bold text-amber-800 text-sm">Department Leaderboard Visibility</div>
          <div className="text-xs text-amber-700 mt-0.5">
            Each department row has an <span className="font-bold">"LB Visible / LB Hidden"</span> button.
            Admins/sub-admins can lock or unlock the department leaderboard for students here.
            Mentors can also toggle their OWN department&apos;s leaderboard from their profile modal.
            When hidden, students lose the &ldquo;My Department&rdquo; tab on their leaderboard.
          </div>
        </div>
      </div>
      <div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sticky top-32">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-500" /> Add Department</h3>
          <form onSubmit={add} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">College</label>
              <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)} disabled={isSubAdmin} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed">
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Department Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., Computer Science & Engineering" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., CSE" required />
            </div>
            <div className="text-xs text-slate-400">Pre-seeded for IES: EEE, ME, R&AI, CE, DS, CSE, ECE</div>
            <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Department</>}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-bold mb-3">Departments {collegeId ? "(filtered)" : "(all)"}</h3>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          <div className="space-y-2">
            {departments.length === 0 ? <div className="text-center py-12 text-slate-400">No departments</div> :
              departments.map(d => (
                <div key={d.id} className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {d.name}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">{d.code}</span>
                    </div>
                    <div className="text-xs text-slate-500">{d.college?.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 mr-2">{d._count.users} users</span>
                    <button
                      onClick={() => toggleLbVisible(d.id)}
                      disabled={togglingId === d.id}
                      title={lbVis[d.id] !== false ? "Department leaderboard visible to students — click to HIDE" : "Department leaderboard hidden from students — click to SHOW"}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border-2 transition disabled:opacity-50 ${lbVis[d.id] !== false ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {togglingId === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                      {lbVis[d.id] !== false ? "LB Visible" : "LB Hidden"}
                    </button>
                    <button onClick={() => setEditing({ ...d })} title="Edit department" className="p-1.5 rounded hover:bg-blue-50 text-blue-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => del(d.id)} title="Delete department" className="p-1.5 rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        }
      </div>

      {editing && (
        <EditModal title="Edit Department" onClose={() => setEditing(null)} onSave={saveEdit} loading={editLoading}>
          <div>
            <label className="text-xs font-bold text-slate-600">Department Name</label>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Code</label>
            <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ============== MENTORS ==============
function MentorsTab({ collegeId, colleges, isSubAdmin }: any) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", name: "", collegeId: collegeId || colleges[0]?.id || "", departmentId: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editDepartments, setEditDepartments] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = collegeId ? `/api/admin/mentors?collegeId=${collegeId}` : "/api/admin/mentors";
      const res = await fetch(url);
      const data = await res.json();
      setMentors(data.mentors || []);
    } finally { setLoading(false); }
  }, [collegeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (colleges.length > 0 && !form.collegeId) setForm(f => ({ ...f, collegeId: colleges[0].id })); }, [colleges, form.collegeId]);

  // Load departments when college changes (for add form)
  useEffect(() => {
    if (!form.collegeId) return;
    (async () => {
      const res = await fetch(`/api/admin/departments?collegeId=${form.collegeId}`);
      const data = await res.json();
      setDepartments(data.departments || []);
      setForm(f => ({ ...f, departmentId: "" }));
    })();
  }, [form.collegeId]);

  // Load departments for edit modal when editing changes
  useEffect(() => {
    if (!editing?.collegeId) return;
    (async () => {
      const res = await fetch(`/api/admin/departments?collegeId=${editing.collegeId}`);
      const data = await res.json();
      setEditDepartments(data.departments || []);
    })();
  }, [editing?.collegeId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password || !form.name || !form.collegeId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Mentor created!");
      setForm({ username: "", password: "", name: "", collegeId: form.collegeId, departmentId: "", email: "", phone: "" });
      load();
    } finally { setSubmitting(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this mentor?")) return;
    const res = await fetch(`/api/admin/mentors?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      // Clear the mentor's Firestore data (leaderboard, activityFeed, notes).
      try { await cleanupUserFirestore(id); } catch (e) { console.warn("Firestore cleanup:", e); }
      toast.success("Deleted"); load();
    }
    else { const d = await res.json(); toast.error(d.error); }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          departmentId: editing.departmentId || null,
          email: editing.email || null,
          phone: editing.phone || null,
          active: editing.active,
          password: editing.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Mentor updated!");
      setEditing(null);
      load();
    } finally { setEditLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto cq-scroll">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500" /> Add Mentor</h3>
          <form onSubmit={add} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">College</label>
              <select value={form.collegeId} onChange={e => setForm(f => ({ ...f, collegeId: e.target.value }))} disabled={isSubAdmin} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed">
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Password</label>
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Department (optional)</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email (optional)</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="email" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Phone (optional)</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Mentor</>}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-bold mb-3">Mentors</h3>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          <div className="space-y-2">
            {mentors.length === 0 ? <div className="text-center py-12 text-slate-400">No mentors yet</div> :
              mentors.map(m => (
                <div key={m.id} className={`rounded-xl bg-white border p-4 ${m.active ? "border-slate-200" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        {m.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">{m.username}</span>
                        {!m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-700 font-bold">INACTIVE</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {m.college?.name} • {m.department?.code || "No dept"}
                        {m.email && ` • ${m.email}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-center mr-2">
                        <div className="font-black text-amber-600">{m._count.students}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Students</div>
                      </div>
                      <button onClick={() => setEditing({ ...m, newPassword: "" })} title="Edit mentor" className="p-1.5 rounded hover:bg-blue-50 text-blue-500">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => del(m.id)} title="Delete mentor" className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        }
      </div>

      {editing && (
        <EditModal title="Edit Mentor" onClose={() => setEditing(null)} onSave={saveEdit} loading={editLoading}>
          <div>
            <label className="text-xs font-bold text-slate-600">Full Name</label>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Username (cannot be changed)</label>
            <input value={editing.username || ""} disabled className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Department</label>
            <select value={editing.departmentId || ""} onChange={e => setEditing({ ...editing, departmentId: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">— None —</option>
              {editDepartments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Email</label>
            <input value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="email" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Phone</label>
            <input value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">New Password (leave blank to keep current)</label>
            <input value={editing.newPassword || ""} onChange={e => setEditing({ ...editing, newPassword: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Enter new password (optional)" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} id="mentor-active" className="rounded" />
            <label htmlFor="mentor-active" className="text-xs font-bold text-slate-600">Active (uncheck to deactivate)</label>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ============== STUDENTS (folder-style drill-down) ==============
function StudentsTab({ user, colleges, isMainAdmin, isSubAdmin }: any) {
  // Drill-down state
  const [level, setLevel] = useState<"college" | "department" | "mentor" | "student" | "detail">(
    isMainAdmin ? "college" : "department"
  );
  const [selectedCollege, setSelectedCollege] = useState<any>(isSubAdmin ? user.college : null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);

  // List state for each level
  const [collegesList, setCollegesList] = useState<any[]>(colleges);
  const [departments, setDepartments] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Add student modal (only available at student level inside a mentor folder)
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "", phone: "", rollNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  // Edit student modal (preserved)
  const [editing, setEditing] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editDepartments, setEditDepartments] = useState<any[]>([]);
  const [editMentors, setEditMentors] = useState<any[]>([]);

  // Keep colleges list in sync with prop (main admin)
  useEffect(() => { if (isMainAdmin) setCollegesList(colleges); }, [colleges, isMainAdmin]);

  // Initial load: sub-admin starts at department level (auto-scoped to their college)
  useEffect(() => {
    if (isSubAdmin && user.collegeId) {
      loadDepartments(user.collegeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Loaders ===
  async function loadDepartments(collegeId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departments?collegeId=${collegeId}`);
      const data = await res.json();
      setDepartments(data.departments || []);
    } finally { setLoading(false); }
  }

  async function loadMentors(collegeId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mentors?collegeId=${collegeId}`);
      const data = await res.json();
      setMentors(data.mentors || []);
    } finally { setLoading(false); }
  }

  async function loadStudents(mentorId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students?mentorId=${mentorId}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  }

  async function loadStudentDetail(studentId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/results?studentId=${studentId}`);
      const data = await res.json();
      if (res.ok) setStudentDetail(data);
    } finally { setLoading(false); }
  }

  // === Navigation handlers ===
  function selectCollege(c: any) {
    setSelectedCollege(c);
    setSelectedDepartment(null);
    setSelectedMentor(null);
    setSelectedStudent(null);
    setStudentDetail(null);
    setLevel("department");
    loadDepartments(c.id);
  }

  function selectDepartment(d: any) {
    setSelectedDepartment(d);
    setSelectedMentor(null);
    setSelectedStudent(null);
    setStudentDetail(null);
    setLevel("mentor");
    if (selectedCollege?.id) loadMentors(selectedCollege.id);
  }

  function selectMentor(m: any) {
    setSelectedMentor(m);
    setSelectedStudent(null);
    setStudentDetail(null);
    setLevel("student");
    loadStudents(m.id);
  }

  function selectStudent(s: any) {
    setSelectedStudent(s);
    setStudentDetail(null);
    setLevel("detail");
    loadStudentDetail(s.id);
  }

  function goToCollegeLevel() {
    setLevel("college");
    setSelectedDepartment(null);
    setSelectedMentor(null);
    setSelectedStudent(null);
    setStudentDetail(null);
  }

  function goToDepartmentLevel() {
    setLevel("department");
    setSelectedMentor(null);
    setSelectedStudent(null);
    setStudentDetail(null);
  }

  function goToMentorLevel() {
    setLevel("student");
    setSelectedStudent(null);
    setStudentDetail(null);
  }

  // === Refresh current level ===
  function refresh() {
    if (level === "detail" && selectedStudent) loadStudentDetail(selectedStudent.id);
    else if (level === "student" && selectedMentor) loadStudents(selectedMentor.id);
    else if (level === "mentor" && selectedCollege) loadMentors(selectedCollege.id);
    else if (level === "department" && selectedCollege) loadDepartments(selectedCollege.id);
  }

  // === Add student (only available inside a mentor folder) ===
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password || !form.name) return;
    if (!selectedCollege?.id || !selectedDepartment?.id) {
      toast.error("College and department must be selected");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          collegeId: selectedCollege.id,
          departmentId: selectedDepartment.id,
          mentorId: selectedMentor?.id || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Student created!");
      setForm({ username: "", password: "", name: "", email: "", phone: "", rollNumber: "" });
      setShowAddForm(false);
      if (selectedMentor) loadStudents(selectedMentor.id);
    } finally { setSubmitting(false); }
  }

  // === Edit student (preserved) ===
  useEffect(() => {
    if (!editing?.collegeId) return;
    (async () => {
      const [dr, mr] = await Promise.all([
        fetch(`/api/admin/departments?collegeId=${editing.collegeId}`),
        fetch(`/api/admin/mentors?collegeId=${editing.collegeId}`),
      ]);
      const dd = await dr.json();
      const md = await mr.json();
      setEditDepartments(dd.departments || []);
      setEditMentors(md.mentors || []);
    })();
  }, [editing?.collegeId]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          departmentId: editing.departmentId || null,
          mentorId: editing.mentorId || null,
          rollNumber: editing.rollNumber || null,
          email: editing.email || null,
          phone: editing.phone || null,
          active: editing.active,
          password: editing.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Student updated!");
      setEditing(null);
      if (selectedMentor) loadStudents(selectedMentor.id);
    } finally { setEditLoading(false); }
  }

  async function toggleActive(s: any) {
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    if (res.ok) {
      toast.success(s.active ? "Deactivated" : "Activated");
      if (selectedMentor) loadStudents(selectedMentor.id);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this student and all their data?")) return;
    const res = await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      // Clear the student's Firestore data (leaderboard, mockRankings,
      // activityFeed, notes). Runs on the client because the Firebase SDK
      // is authenticated, so the security rules allow the admin to delete.
      try { await cleanupUserFirestore(id); } catch (e) { console.warn("Firestore cleanup:", e); }
      toast.success("Deleted");
      if (selectedMentor) loadStudents(selectedMentor.id);
    }
  }

  // Filter mentors by selected department (mentors API only filters by collegeId)
  const filteredMentors = selectedDepartment
    ? mentors.filter(m => m.departmentId === selectedDepartment.id)
    : mentors;

  // === Breadcrumb ===
  const breadcrumb = (
    <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 flex-wrap">
      <button
        onClick={() => (isMainAdmin ? goToCollegeLevel() : goToDepartmentLevel())}
        className="hover:text-amber-600 font-bold text-slate-700"
      >
        <Users className="w-3.5 h-3.5 inline mr-1" />Students
      </button>
      {selectedCollege && level !== "college" && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={isMainAdmin ? goToCollegeLevel : undefined}
            className={`font-bold ${isMainAdmin ? "hover:text-amber-600 text-slate-700" : "text-slate-400 cursor-default"}`}
          >
            <Building2 className="w-3.5 h-3.5 inline mr-1" />
            {selectedCollege.name}
          </button>
        </>
      )}
      {selectedDepartment && (level === "mentor" || level === "student" || level === "detail") && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button onClick={goToDepartmentLevel} className="hover:text-amber-600 font-bold text-slate-700">
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            {selectedDepartment.name}
          </button>
        </>
      )}
      {selectedMentor && (level === "student" || level === "detail") && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button onClick={goToMentorLevel} className="hover:text-amber-600 font-bold text-slate-700">
            <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
            {selectedMentor.name}
          </button>
        </>
      )}
      {selectedStudent && level === "detail" && studentDetail && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-amber-600">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            {studentDetail.student.name}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div>
      {/* Top toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
          <Users className="w-5 h-5 text-amber-500" /> Students
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold flex items-center gap-1.5 hover:bg-slate-200 transition"
            title="Refresh current list"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {breadcrumb}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      )}

      {/* LEVEL 1A: College list (main admin root) */}
      {!loading && level === "college" && isMainAdmin && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
            <Folder className="w-4 h-4" /> Select a college to browse its students
          </div>
          {collegesList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No colleges yet. Add colleges in the Colleges tab first.</p>
            </div>
          ) : (
            collegesList.map(c => (
              <button
                key={c.id}
                onClick={() => selectCollege(c)}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-amber-300 hover:shadow-sm transition flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.location || "—"} • Code: {c.code}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))
          )}
        </div>
      )}

      {/* LEVEL 1B/2: Department list (main admin inside college, OR sub-admin root) */}
      {!loading && level === "department" && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" />
            {isMainAdmin ? `Departments in ${selectedCollege?.name}` : `Departments in ${user.college?.name}`}
          </div>
          {departments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No departments yet.</p>
              <p className="text-xs mt-1">Add departments in the Departments tab first.</p>
            </div>
          ) : (
            departments.map(d => (
              <button
                key={d.id}
                onClick={() => selectDepartment(d)}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base flex items-center gap-2">
                    {d.name}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">{d.code}</span>
                  </div>
                  <div className="text-xs text-slate-500">{d._count?.users || 0} users</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))
          )}
        </div>
      )}

      {/* LEVEL 2/3: Mentor list (filtered by selected department) */}
      {!loading && level === "mentor" && (
        <div className="space-y-2">
          <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" /> Mentors in {selectedDepartment?.name}
          </div>
          {filteredMentors.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No mentors in this department.</p>
              <p className="text-xs mt-1">Add mentors in the Mentors tab first.</p>
            </div>
          ) : (
            filteredMentors.map(m => (
              <button
                key={m.id}
                onClick={() => selectMentor(m)}
                className="w-full text-left rounded-xl bg-white border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition flex items-center gap-3"
              >
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
          )}
        </div>
      )}

      {/* LEVEL 3/4: Student list (inside mentor folder) — Add Student option here */}
      {!loading && level === "student" && selectedMentor && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="text-sm text-slate-500 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" /> Students under {selectedMentor.name}
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">{students.length}</span>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No students assigned to this mentor yet.</p>
              <p className="text-xs mt-1">Click "Add Student" to create one.</p>
            </div>
          ) : (
            students.map(s => (
              <div key={s.id} className={`rounded-xl bg-white border p-3 ${s.active ? "border-slate-200" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => selectStudent(s)} className="min-w-0 flex-1 text-left">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      {s.name}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.username || s.email}</span>
                      {!s.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-700 font-bold">INACTIVE</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.college?.name} • {s.department?.code} {s.rollNumber && `• ${s.rollNumber}`}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs flex-wrap">
                      <span className="text-amber-600 font-bold">⚡{s.xp} XP</span>
                      <span className="text-purple-600 font-bold">Lvl {s.level}</span>
                      <span className="text-orange-600 font-bold">🔥{s.streak}</span>
                      <span className="text-cyan-600 font-bold">📝{s._count.practiceAttempts}</span>
                      <span className="text-emerald-600 font-bold">🎯{s._count.mockAttempts}</span>
                      <span className="text-pink-600 font-bold">🏅{s._count.studentBadges}</span>
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing({ ...s, newPassword: "" })} title="Edit student" className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(s)} title="Toggle active" className="p-1.5 rounded hover:bg-amber-50 text-amber-500"><UserCog className="w-4 h-4" /></button>
                    <button onClick={() => del(s.id)} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LEVEL 4/5: Student detail results */}
      {!loading && level === "detail" && studentDetail && (
        <StudentDetailResults studentDetail={studentDetail} />
      )}

      {/* ADD STUDENT MODAL — only accessible from student list level inside a mentor folder */}
      {showAddForm && selectedMentor && (
        <AddStudentModal
          form={form}
          setForm={setForm}
          submitting={submitting}
          onClose={() => setShowAddForm(false)}
          onSubmit={add}
          collegeName={selectedCollege?.name}
          departmentName={selectedDepartment?.name}
          mentorName={selectedMentor?.name}
        />
      )}

      {/* EDIT STUDENT MODAL (preserved) */}
      {editing && (
        <EditModal title="Edit Student" onClose={() => setEditing(null)} onSave={saveEdit} loading={editLoading}>
          <div>
            <label className="text-xs font-bold text-slate-600">Full Name</label>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Username / Email (cannot be changed)</label>
            <input value={editing.username || editing.email || ""} disabled className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Roll Number (KTU Reg)</label>
            <input value={editing.rollNumber || ""} onChange={e => setEditing({ ...editing, rollNumber: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., IES21CSE001" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Department</label>
            <select value={editing.departmentId || ""} onChange={e => setEditing({ ...editing, departmentId: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">— None —</option>
              {editDepartments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Mentor</label>
            <select value={editing.mentorId || ""} onChange={e => setEditing({ ...editing, mentorId: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">— None —</option>
              {editMentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Email</label>
            <input value={editing.email || ""} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="email" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Phone</label>
            <input value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">New Password (leave blank to keep current)</label>
            <input value={editing.newPassword || ""} onChange={e => setEditing({ ...editing, newPassword: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Enter new password (optional)" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} id="student-active" className="rounded" />
            <label htmlFor="student-active" className="text-xs font-bold text-slate-600">Active (uncheck to deactivate)</label>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ============== STUDENT DETAIL RESULTS (deepest drill-down level) ==============
function StudentDetailResults({ studentDetail }: { studentDetail: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {/* Student header */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl">
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

      {/* Week-wise practice results */}
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
  );
}

// ============== ADD STUDENT MODAL (inside mentor folder) ==============
function AddStudentModal({ form, setForm, submitting, onClose, onSubmit, collegeName, departmentName, mentorName }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-amber-500" /> Add Student</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          {/* Context summary - pre-selected from drill-down */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
            <div className="text-slate-500 mb-1 font-bold">Adding student to:</div>
            <div className="flex items-center gap-1 flex-wrap text-slate-700">
              <Building2 className="w-3 h-3" />{collegeName}
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <Layers className="w-3 h-3" />{departmentName}
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <GraduationCap className="w-3 h-3" />{mentorName}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600">Full Name</label>
            <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Roll Number</label>
            <input value={form.rollNumber} onChange={e => setForm((f: any) => ({ ...f, rollNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., IES21CSE001" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Username</label>
            <input value={form.username} onChange={e => setForm((f: any) => ({ ...f, username: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Password</label>
            <input value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Email (optional)</label>
            <input value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="email" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Phone (optional)</label>
            <input value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Student</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== SUB-ADMINS ==============
function SubAdminsTab() {
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", name: "", collegeId: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/sub-admins"),
        fetch("/api/admin/colleges"),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      setSubAdmins(d1.subAdmins || []);
      setColleges(d2.colleges || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (colleges.length > 0 && !form.collegeId) setForm(f => ({ ...f, collegeId: colleges[0].id })); }, [colleges, form.collegeId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password || !form.name || !form.collegeId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/sub-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Sub-Admin created!");
      setForm({ username: "", password: "", name: "", collegeId: form.collegeId, email: "", phone: "" });
      load();
    } finally { setSubmitting(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this sub-admin? They will lose access immediately.")) return;
    const res = await fetch(`/api/admin/sub-admins?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      // Clear the sub-admin's Firestore data (leaderboard, activityFeed, notes).
      try { await cleanupUserFirestore(id); } catch (e) { console.warn("Firestore cleanup:", e); }
      toast.success("Deleted"); load();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sticky top-32">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500" /> Add Sub-Admin</h3>
          <div className="text-xs text-slate-500 mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
            A sub-admin can only manage <strong>one college</strong> (departments, mentors, students) and view only that college's analytics.
          </div>
          <form onSubmit={add} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">College (will be locked to this college)</label>
              <select value={form.collegeId} onChange={e => setForm(f => ({ ...f, collegeId: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required>
                <option value="">— Select College —</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Username (for login)</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Password</label>
              <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email (optional)</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="email" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Phone (optional)</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Sub-Admin</>}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3">Sub-admins log in via the <strong>Admin Portal</strong> with the username and password you set here. They cannot create colleges or see other colleges' data.</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-bold mb-3">Sub-Admins ({subAdmins.length})</h3>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          <div className="space-y-2">
            {subAdmins.length === 0 ? <div className="text-center py-12 text-slate-400">No sub-admins yet. Add one to delegate college management.</div> :
              subAdmins.map(s => (
                <div key={s.id} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      {s.name}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">{s.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">Sub-Admin</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      College: <strong>{s.college?.name}</strong>
                      {s.email && ` • ${s.email}`}
                    </div>
                  </div>
                  <button onClick={() => del(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))
            }
          </div>
        }
      </div>
    </div>
  );
}

// ============== REUSABLE EDIT MODAL ==============
function EditModal({ title, onClose, onSave, loading, children }: {
  title: string;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-base flex items-center gap-2"><Pencil className="w-4 h-4 text-purple-500" /> {title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSave} className="p-4 space-y-3">
          {children}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Pencil className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== EXPORTS ==============
function ExportsTab({ collegeId }: any) {
  const urls = [
    { type: "students", label: "All Students (full stats)", icon: Users, color: "from-amber-500 to-orange-500", desc: "Username, name, college, dept, mentor, XP, level, streak, practice/mock counts, login count, etc." },
    { type: "mentors", label: "All Mentors", icon: GraduationCap, color: "from-emerald-500 to-green-500", desc: "Username, name, college, dept, students count, contact info." },
    { type: "activity", label: "Activity Log (last 5000)", icon: Activity, color: "from-cyan-500 to-blue-500", desc: "Every action by every user — logins, page views, practice answers, mock completions." },
    { type: "mock", label: "Mock Test Attempts", icon: Target, color: "from-purple-500 to-pink-500", desc: "All mock test attempts with scores, percentages, and time taken." },
  ];

  function download(type: string) {
    const url = collegeId ? `/api/admin/export?type=${type}&collegeId=${collegeId}` : `/api/admin/export?type=${type}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      <h2 className="text-2xl font-black mb-1">Export Data (CSV)</h2>
      <p className="text-slate-500 text-sm mb-6">Download complete data for offline analysis, reports, or sharing. {collegeId ? "Filtered by selected college." : "Showing all colleges."}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {urls.map(u => {
          const Icon = u.icon;
          return (
            <button
              key={u.type}
              onClick={() => download(u.type)}
              className="text-left rounded-2xl bg-white border border-slate-200 p-5 hover:border-purple-300 hover:shadow-md transition cq-card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="font-bold mb-1 flex items-center gap-2">
                {u.label} <Download className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">{u.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
