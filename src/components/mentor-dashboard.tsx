"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, LogOut, Users, Download, Zap, Flame, Target, Brain, Award,
  TrendingUp, Activity, ChevronDown, ChevronUp, Eye, Crown,
  User as UserIcon, Pencil, X, Mail, Phone, Shield, Save, BookOpen,
  Trash2, AlertCircle, RefreshCw
} from "lucide-react";
import { MockTestPlayer } from "@/components/mock-test-player";
import { ResultsView } from "@/components/results-view";

export function MentorDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMockTests, setShowMockTests] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentor/students");
      const data = await res.json();
      setStudents(data.students || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  // Compute aggregate stats
  const totals = students.reduce((acc, s) => ({
    xp: acc.xp + s.xp,
    practice: acc.practice + s._count.practiceAttempts,
    mock: acc.mock + s._count.mockAttempts,
    badges: acc.badges + s._count.studentBadges,
    logins: acc.logins + s._count.activityLogs,
  }), { xp: 0, practice: 0, mock: 0, badges: 0, logins: 0 });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-xl shadow-lg shrink-0">⚖️</div>
            <div className="min-w-0">
              <div className="font-black text-lg leading-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-xs text-slate-500 leading-tight truncate">Mentor: {user.name} • {user.college?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={load}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-sm font-bold flex items-center gap-2"
              title="Refresh student list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowResults(true)}
              className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-sm font-bold flex items-center gap-2"
              title="Student Results"
            >
              <TrendingUp className="w-4 h-4" /> <span className="hidden sm:inline">Results</span>
            </button>
            <button
              onClick={() => setShowMockTests(true)}
              className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-bold flex items-center gap-2"
              title="Test Mock Tests"
            >
              <Target className="w-4 h-4" /> <span className="hidden sm:inline">Test Mock Tests</span>
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-sm font-bold flex items-center gap-2"
              title="Edit Profile"
            >
              <UserIcon className="w-4 h-4" /> <span className="hidden sm:inline">Profile</span>
            </button>
            <a
              href="/api/mentor/export"
              className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
            </a>
            <button onClick={handleLogout} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 hover:text-red-600 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black">My Students</h1>
            <p className="text-slate-500 text-sm">You can only see students assigned to you. Click a student to view their detailed progress.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold flex items-center gap-2 shadow-sm disabled:opacity-60 transition"
            title="Refresh student list and progress"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Results
          </button>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatBox icon={Users} label="Students" value={students.length} color="bg-amber-50 text-amber-600 border-amber-200" />
          <StatBox icon={Zap} label="Total XP" value={totals.xp} color="bg-purple-50 text-purple-600 border-purple-200" />
          <StatBox icon={Brain} label="Practice Qs" value={totals.practice} color="bg-cyan-50 text-cyan-600 border-cyan-200" />
          <StatBox icon={Target} label="Mock Tests" value={totals.mock} color="bg-orange-50 text-orange-600 border-orange-200" />
          <StatBox icon={Award} label="Badges" value={totals.badges} color="bg-pink-50 text-pink-600 border-pink-200" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No students assigned to you yet.</p>
            <p className="text-sm">Ask the admin to assign students to your account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                expanded={expanded === s.id}
                onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mock Test Player (full screen overlay) */}
      {showMockTests && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <MockTestPlayer user={user} onExit={() => setShowMockTests(false)} />
          </div>
        </div>
      )}

      {/* Results View (full screen overlay) */}
      {showResults && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <ResultsView user={user} apiBase="/api/mentor/results" onExit={() => setShowResults(false)} />
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfile && (
          <MentorProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
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

// ============== MENTOR PROFILE MODAL ==============
function MentorProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", newPassword: "", currentPassword: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentor/profile");
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setForm({
          name: data.profile.name || "",
          phone: data.profile.phone || "",
          newPassword: "",
          currentPassword: "",
        });
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = { name: form.name, phone: form.phone };
      if (form.newPassword) {
        body.newPassword = form.newPassword;
        body.currentPassword = form.currentPassword;
      }
      const res = await fetch("/api/mentor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Profile updated!");
      setForm(f => ({ ...f, newPassword: "", currentPassword: "" }));
      load();
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-base flex items-center gap-2"><Pencil className="w-4 h-4 text-emerald-500" /> My Profile</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : profile ? (
          <form onSubmit={save} className="p-4 space-y-3">
            {/* Profile header */}
            <div className="flex items-center gap-3 mb-2 p-3 rounded-xl bg-slate-50">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{profile.name}</div>
                <div className="text-xs text-slate-500 truncate">{profile.email || profile.username}</div>
                <div className="flex gap-1 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold uppercase">Mentor</span>
                  
                  {profile.authMethod === "LOCAL" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">LOCAL</span>}
                </div>
              </div>
            </div>

            {/* Read-only info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 uppercase text-[10px] font-bold">College</div>
                <div className="text-slate-700 truncate">{profile.college?.name || "—"}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Department</div>
                <div className="text-slate-700 truncate">{profile.department?.name || "—"}</div>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="text-xs font-bold text-slate-600">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Your phone number" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email <span className="text-slate-400">(cannot be changed)</span></label>
              <input value={profile.email || ""} disabled className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 cursor-not-allowed" />
            </div>

            {/* Password change section */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" /> Change Password
              </h4>
              <div className="mb-2">
                <input type="password" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Current password (required to change)" />
              </div>
              <div>
                <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="New password (min 6 chars) — leave blank to keep" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Close
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12 text-slate-400">Failed to load profile.</div>
        )}
        {profile && <MentorDeleteAccount user={profile} onDeleted={onClose} />}
      </motion.div>
    </motion.div>
  );
}

// ============== MENTOR DELETE ACCOUNT SECTION ==============
function MentorDeleteAccount({ user, onDeleted }: { user: any; onDeleted: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Are you absolutely sure? This will PERMANENTLY delete your mentor account and login credentials. This cannot be undone.")) return;
    setLoading(true);
    try {
      // Step 1: Delete Firebase account on the CLIENT side
      const { auth, signInWithEmailAndPassword } = await import("@/lib/firebase");
      if (auth) {
        try {
          if (user.email && password) {
            await signInWithEmailAndPassword(auth, user.email, password);
          }
          if (auth.currentUser) {
            await auth.currentUser.delete();
          }
        } catch (fbErr: any) {
          if (auth.currentUser) {
            try { await auth.currentUser.delete(); } catch {}
          }
          console.error("Firebase deletion failed (DB will still be deleted):", fbErr?.code);
        }
      }

      // Step 2: Delete from database
      const res = await fetch("/api/mentor/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      // Step 3: Sign out
      try {
        const { auth } = await import("@/lib/firebase");
        if (auth) await auth.signOut();
      } catch {}

      toast.success("Account deleted. Goodbye! 👋");
      setTimeout(() => onDeleted(), 1000);
    } finally { setLoading(false); }
  }

  return (
    <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3">
      <h4 className="text-sm font-bold mb-1.5 flex items-center gap-1.5 text-red-600">
        <AlertCircle className="w-4 h-4" /> Danger Zone
      </h4>
      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} className="px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-red-600 font-bold text-xs flex items-center gap-1.5 hover:bg-red-200 transition">
          <Trash2 className="w-3.5 h-3.5" /> Delete My Account
        </button>
      ) : (
        <form onSubmit={deleteAccount} className="space-y-2">
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">⚠️ This will permanently delete your account. You cannot delete if you have students assigned.</p>
          {user.authMethod === "LOCAL" && (
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm" placeholder="Your password" required />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowConfirm(false); setPassword(""); }} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-60">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete Forever"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StudentRow({ student: s, expanded, onToggle }: any) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black shrink-0">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="font-bold flex items-center gap-2 flex-wrap">
              {s.name}
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.username}</span>
              {s.rollNumber && <span className="text-xs text-slate-500">{s.rollNumber}</span>}
            </div>
            <div className="text-xs text-slate-500">{s.department?.name}</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="font-black text-amber-600 flex items-center gap-1"><Zap className="w-3 h-3" />{s.xp}</div>
            <div className="text-[10px] text-slate-500 uppercase">XP</div>
          </div>
          <div className="text-center">
            <div className="font-black text-purple-600">Lvl {s.level}</div>
            <div className="text-[10px] text-slate-500 uppercase">Level</div>
          </div>
          <div className="text-center">
            <div className="font-black text-orange-600 flex items-center gap-1"><Flame className="w-3 h-3" />{s.streak}</div>
            <div className="text-[10px] text-slate-500 uppercase">Streak</div>
          </div>
          <div className="text-center">
            <div className="font-black text-cyan-600">{s._count.practiceAttempts}</div>
            <div className="text-[10px] text-slate-500 uppercase">Practice</div>
          </div>
          <div className="text-center">
            <div className="font-black text-emerald-600">{s._count.mockAttempts}</div>
            <div className="text-[10px] text-slate-500 uppercase">Mocks</div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-slate-200 p-4 bg-slate-50"
        >
          {/* Mobile stats */}
          <div className="sm:hidden grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-white rounded-lg"><div className="font-bold text-amber-600">{s.xp}</div><div className="text-[10px] text-slate-500">XP</div></div>
            <div className="text-center p-2 bg-white rounded-lg"><div className="font-bold text-purple-600">Lvl {s.level}</div><div className="text-[10px] text-slate-500">Level</div></div>
            <div className="text-center p-2 bg-white rounded-lg"><div className="font-bold text-orange-600">{s.streak} days</div><div className="text-[10px] text-slate-500">Streak</div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Week-wise progress */}
            <div className="md:col-span-2">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4 text-emerald-500" /> Week-wise Practice Progress</h4>
              <div className="space-y-1.5">
                {s.weekStats.length === 0 ? (
                  <div className="text-xs text-slate-400">No practice attempts yet.</div>
                ) : (
                  s.weekStats.map((ws: any, i: number) => {
                    const pct = ws.attempted > 0 ? Math.round((ws.correct / ws.attempted) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-16 text-slate-500">Week {i + 1}</div>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-20 text-right text-slate-600">{ws.correct}/{ws.attempted} ({pct}%)</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mock attempts */}
              <h4 className="font-bold text-sm mb-2 mt-4 flex items-center gap-1"><Target className="w-4 h-4 text-amber-500" /> Mock Test Results</h4>
              {s.mockAttempts.length === 0 ? (
                <div className="text-xs text-slate-400">No mock tests attempted yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {s.mockAttempts.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg text-xs">
                      <div className="font-medium">{m.title}</div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${m.percent >= 75 ? "text-emerald-600" : m.percent >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {m.score}/{m.total} ({m.percent}%)
                        </span>
                        <span className="text-slate-400">{new Date(m.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity log */}
            <div>
              <h4 className="font-bold text-sm mb-2 flex items-center gap-1"><Activity className="w-4 h-4 text-cyan-500" /> Recent Activity</h4>
              <div className="bg-white rounded-lg p-2 max-h-64 overflow-y-auto cq-scroll">
                {s.recentActivity.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2 text-center">No activity yet</div>
                ) : (
                  <div className="space-y-1">
                    {s.recentActivity.map((a: any, i: number) => (
                      <div key={i} className="text-[10px] py-1 border-b border-slate-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <code className="text-purple-600 font-bold">{a.action}</code>
                          <span className="text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                        </div>
                        {a.details && <div className="text-slate-500 truncate">{a.details}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <div><strong>Last login:</strong> {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : "Never"}</div>
                <div><strong>Total logins:</strong> {s._count.activityLogs}</div>
                <div><strong>Badges earned:</strong> {s._count.studentBadges}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
