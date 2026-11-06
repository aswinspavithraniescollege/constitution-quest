"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, LogOut, Building2, Users, GraduationCap, Layers, Download,
  TrendingUp, Activity, Award, BarChart3, Plus, Trash2, Shield, Eye,
  Crown, Zap, Target, Brain, ChevronDown, Filter, RefreshCw, UserCog, KeyRound,
  UserCheck, AlertCircle, Pencil, X
} from "lucide-react";
import { RealtimeActivityFeed } from "@/components/realtime/realtime-activity-feed";
import { AnnouncementsManager } from "@/components/realtime/announcements";
import { MockTestPlayer } from "@/components/mock-test-player";

type Tab = "overview" | "colleges" | "departments" | "mentors" | "students" | "sub-admins" | "exports" | "mock-tests";

export function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");

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
    { key: "exports", label: "Export Data", icon: Download },
    { key: "mock-tests", label: "Test Mock Tests", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-xl shadow-lg shrink-0">⚖️</div>
            <div className="min-w-0">
              <div className="font-black text-lg leading-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-xs text-slate-500 leading-tight">
                {isMainAdmin ? "Main Admin Control Panel" : `Sub-Admin Panel • ${user.college?.name || ""}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        {(tab === "departments" || tab === "mentors" || tab === "students" || tab === "exports") && isMainAdmin && (
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
        {isSubAdmin && (tab === "departments" || tab === "mentors" || tab === "students" || tab === "exports") && (
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
        {tab === "students" && <StudentsTab collegeId={selectedCollegeId} colleges={colleges} isSubAdmin={isSubAdmin} />}
        {tab === "exports" && <ExportsTab collegeId={selectedCollegeId} />}
        {tab === "mock-tests" && <MockTestPlayer user={user} onExit={() => setTab("overview")} />}
      </main>
    </div>
  );
}

// ============== OVERVIEW ==============
function OverviewTab({ isMainAdmin, user }: { isMainAdmin: boolean; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

// ============== COLLEGES ==============
function CollegesTab({ colleges, onRefresh }: any) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

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
    if (res.ok) { toast.success("Deleted"); load(); }
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

// ============== STUDENTS ==============
function StudentsTab({ collegeId, colleges, isSubAdmin }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", name: "", collegeId: collegeId || colleges[0]?.id || "", departmentId: "", mentorId: "", email: "", phone: "", rollNumber: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editDepartments, setEditDepartments] = useState<any[]>([]);
  const [editMentors, setEditMentors] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (collegeId) params.set("collegeId", collegeId);
      const res = await fetch(`/api/admin/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  }, [collegeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (colleges.length > 0 && !form.collegeId) setForm(f => ({ ...f, collegeId: colleges[0].id })); }, [colleges, form.collegeId]);

  useEffect(() => {
    if (!form.collegeId) return;
    (async () => {
      const [dr, mr] = await Promise.all([
        fetch(`/api/admin/departments?collegeId=${form.collegeId}`),
        fetch(`/api/admin/mentors?collegeId=${form.collegeId}`),
      ]);
      const dd = await dr.json();
      const md = await mr.json();
      setDepartments(dd.departments || []);
      setMentors(md.mentors || []);
      setForm(f => ({ ...f, departmentId: "", mentorId: "" }));
    })();
  }, [form.collegeId]);

  // Load departments & mentors for edit modal when editing.collegeId changes
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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password || !form.name || !form.collegeId || !form.departmentId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Student created!");
      setForm({ username: "", password: "", name: "", collegeId: form.collegeId, departmentId: "", mentorId: "", email: "", phone: "", rollNumber: "" });
      load();
    } finally { setSubmitting(false); }
  }

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
      load();
    } finally { setEditLoading(false); }
  }

  async function toggleActive(s: any) {
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    if (res.ok) { toast.success(s.active ? "Deactivated" : "Activated"); load(); }
  }

  async function del(id: string) {
    if (!confirm("Delete this student and all their data?")) return;
    const res = await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto cq-scroll">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-amber-500" /> Add Student</h3>
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
              <label className="text-xs font-bold text-slate-600">Roll Number</label>
              <input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="e.g., IES21CSE001" />
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
              <label className="text-xs font-bold text-slate-600">Department</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required>
                <option value="">— Select —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Mentor (optional)</label>
              <select value={form.mentorId} onChange={e => setForm(f => ({ ...f, mentorId: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="">— None —</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.username})</option>)}
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
            <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Student</>}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-bold mb-3">Students ({students.length})</h3>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto cq-scroll pr-1">
            {students.length === 0 ? <div className="text-center py-12 text-slate-400">No students yet</div> :
              students.map(s => (
                <div key={s.id} className={`rounded-xl bg-white border p-3 ${s.active ? "border-slate-200" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        {s.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.username || s.email}</span>
                        {!s.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-700 font-bold">INACTIVE</span>}
                        
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {s.college?.name} • {s.department?.code} {s.rollNumber && `• ${s.rollNumber}`}
                        {s.mentor && ` • Mentor: ${s.mentor.name}`}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs flex-wrap">
                        <span className="text-amber-600 font-bold">⚡{s.xp} XP</span>
                        <span className="text-purple-600 font-bold">Lvl {s.level}</span>
                        <span className="text-orange-600 font-bold">🔥{s.streak}</span>
                        <span className="text-cyan-600 font-bold">📝{s._count.practiceAttempts}</span>
                        <span className="text-emerald-600 font-bold">🎯{s._count.mockAttempts}</span>
                        <span className="text-pink-600 font-bold">🏅{s._count.studentBadges}</span>
                        <span className="text-slate-500 font-bold">🔑{s._count.activityLogs} logs</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing({ ...s, newPassword: "" })} title="Edit student" className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toggleActive(s)} title="Toggle active" className="p-1.5 rounded hover:bg-amber-50 text-amber-500"><UserCog className="w-4 h-4" /></button>
                      <button onClick={() => del(s.id)} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        }
      </div>

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
    if (res.ok) { toast.success("Deleted"); load(); }
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
