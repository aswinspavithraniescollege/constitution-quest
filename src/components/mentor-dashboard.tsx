"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, LogOut, Users, Download, Zap, Flame, Target, Brain, Award,
  TrendingUp, Activity, ChevronDown, ChevronUp, Eye, EyeOff, Crown,
  User as UserIcon, Pencil, X, Mail, Phone, Shield, Save, BookOpen,
  Trash2, AlertCircle, RefreshCw, MessageCircle
} from "lucide-react";
import { MockTestPlayer } from "@/components/mock-test-player";
import { ResultsView } from "@/components/results-view";
import { cleanupUserFirestore } from "@/lib/firestore";
import { ChatView } from "@/components/realtime/chat-view";

export function MentorDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMockTests, setShowMockTests] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showChat, setShowChat] = useState(false);
  // Student management state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Delete a student (only allowed if the student is in the mentor's department;
  // the server enforces this, so we just pass the id).
  async function handleDeleteStudent(student: any) {
    if (!confirm(
      `Delete ${student.name}?\n\nThis permanently removes the student and ALL their practice/mock history, XP, badges, and leaderboard entry. This cannot be undone.`
    )) return;
    setDeletingId(student.id);
    try {
      const res = await fetch(`/api/mentor/students?id=${student.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete student");
        return;
      }
      // Server confirmed DB deletion — now clear the student's Firestore data
      // (leaderboard, mockRankings, activityFeed, notes). This runs on the
      // client because the Firebase SDK is authenticated, so the (loosened)
      // security rules allow the mentor to delete these entries.
      try {
        const cleanup = await cleanupUserFirestore(student.id);
        if (!cleanup.ok && cleanup.failed.length > 0) {
          console.warn("Firestore cleanup partial failure:", cleanup.failed);
        }
      } catch (e) {
        console.warn("Firestore cleanup error (DB record was still deleted):", e);
      }
      toast.success(`${student.name} has been removed.`);
      // Collapse the row if it was expanded
      if (expanded === student.id) setExpanded(null);
      await load();
    } catch (e) {
      toast.error("Network error while deleting student");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStudentSaved() {
    setEditingStudent(null);
    await load();
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
              <img src="/logo-48.png" alt="Constitution Quest" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-lg leading-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Constitution Quest</div>
              <div className="text-xs text-slate-500 leading-tight truncate">Mentor: {user.name} • {user.college?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowChat(true)}
              className="px-3 py-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-sm font-bold flex items-center gap-2"
              title="Chat"
            >
              <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">Chat</span>
            </button>
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
                mentorDepartmentId={user.departmentId}
                onEdit={() => setEditingStudent(s)}
                onDelete={() => handleDeleteStudent(s)}
                deleting={deletingId === s.id}
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

      {/* Chat (full screen overlay) */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black flex items-center gap-2"><MessageCircle className="w-6 h-6 text-cyan-500" /> Chat</h1>
              <button onClick={() => setShowChat(false)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm">Close</button>
            </div>
            <ChatView user={user} />
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfile && (
          <MentorProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      {/* Student Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <StudentEditModal
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onSaved={handleStudentSaved}
          />
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
  // Department leaderboard visibility (mentor can toggle for their own dept)
  const [deptLbVisible, setDeptLbVisible] = useState<boolean | null>(null);
  const [deptLbHasDept, setDeptLbHasDept] = useState(true);
  const [deptLbToggling, setDeptLbToggling] = useState(false);
  // College leaderboard visibility for this mentor's department (per-dept override)
  const [collegeLbForDeptVisible, setCollegeLbForDeptVisible] = useState<boolean | null>(null);
  const [collegeLbForDeptToggling, setCollegeLbForDeptToggling] = useState(false);
  // Chat visibility toggles (mentor controls dept/college/mentor chat, NOT global)
  const [deptChatOn, setDeptChatOn] = useState<boolean | null>(null);
  const [deptStudentsChatOn, setDeptStudentsChatOn] = useState<boolean | null>(null);
  const [dmChatOn, setDmChatOn] = useState<boolean | null>(null);
  const [collegeChatOn, setCollegeChatOn] = useState<boolean | null>(null);
  const [mentorChatOn, setMentorChatOn] = useState<boolean | null>(null);
  const [chatToggling, setChatToggling] = useState<string | null>(null);

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
      // Fetch department leaderboard visibility settings (both toggles)
      try {
        const lbRes = await fetch("/api/mentor/department-leaderboard");
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setDeptLbVisible(lbData.departmentLeaderboardVisible);
          setCollegeLbForDeptVisible(lbData.collegeLeaderboardVisibleForDept);
          setDeptLbHasDept(!!lbData.hasDepartment);
        }
      } catch (e) { console.warn("Failed to load dept leaderboard setting:", e); }
      // Fetch chat visibility settings
      try {
        const chatRes = await fetch("/api/mentor/chat-settings");
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setDeptChatOn(chatData.deptChatVisible);
          setDeptStudentsChatOn(chatData.deptStudentsChatVisible);
          setDmChatOn(chatData.dmChatVisible);
          setCollegeChatOn(chatData.collegeChatVisible);
          setMentorChatOn(chatData.mentorChatVisible);
        }
      } catch (e) { console.warn("Failed to load chat settings:", e); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleDeptLb() {
    if (deptLbVisible === null) return;
    const next = !deptLbVisible;
    setDeptLbToggling(true);
    try {
      const res = await fetch("/api/mentor/department-leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderboardVisible: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to toggle", {
          description: data.error && data.error.includes("Setting")
            ? "Run `npm run db:push` to create the settings table."
            : undefined,
        });
        return;
      }
      setDeptLbVisible(next);
      toast.success(`Department leaderboard ${next ? "ENABLED" : "DISABLED"} for students.`);
    } catch (e) {
      toast.error("Network error while toggling");
    } finally { setDeptLbToggling(false); }
  }

  // Toggle whether students in this mentor's department can see the COLLEGE
  // leaderboard. This is a per-department override — the mentor can cut off
  // their own students from the college-wide leaderboard without affecting
  // other departments.
  async function toggleCollegeLbForDept() {
    if (collegeLbForDeptVisible === null) return;
    const next = !collegeLbForDeptVisible;
    setCollegeLbForDeptToggling(true);
    try {
      const res = await fetch("/api/mentor/department-leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeLeaderboardVisibleForDept: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to toggle", {
          description: data.error && data.error.includes("Setting")
            ? "Run `npm run db:push` to create the settings table."
            : undefined,
        });
        return;
      }
      setCollegeLbForDeptVisible(next);
      toast.success(`College leaderboard for your department ${next ? "ENABLED" : "DISABLED"}.`);
    } catch (e) {
      toast.error("Network error while toggling");
    } finally { setCollegeLbForDeptToggling(false); }
  }

  // Toggle chat visibility (dept/college/mentor — NOT global, which is admin-only)
  async function toggleChat(scope: string, current: boolean | null) {
    if (current === null) return;
    const next = !current;
    setChatToggling(scope);
    try {
      const res = await fetch("/api/mentor/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, visible: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to toggle");
        return;
      }
      if (scope === "dept") setDeptChatOn(next);
      if (scope === "dept-students") setDeptStudentsChatOn(next);
      if (scope === "dm") setDmChatOn(next);
      if (scope === "college") setCollegeChatOn(next);
      if (scope === "mentor") setMentorChatOn(next);
      const labelMap: Record<string, string> = {
        "dept": "Department", "dept-students": "Students-only", "dm": "DM",
        "college": "College", "mentor": "Mentor",
      };
      toast.success(`${labelMap[scope] || scope} chat ${next ? "ENABLED" : "DISABLED"}.`);
    } catch (e) {
      toast.error("Network error while toggling");
    } finally { setChatToggling(null); }
  }

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

            {/* Department leaderboard visibility toggle */}
            <div className="pt-3 border-t border-slate-200">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-amber-800">
                  <Crown className="w-4 h-4 text-amber-500" /> Leaderboard Visibility for Your Department
                </h4>
                {deptLbHasDept ? (
                  <div className="space-y-2">
                    {/* Toggle 1: Department leaderboard */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200 cursor-pointer hover:bg-amber-50/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">
                          {deptLbVisible === null ? "Loading…" : deptLbVisible ? "Department leaderboard: Visible" : "Department leaderboard: Hidden"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          The &ldquo;My Department&rdquo; tab for students in your department.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleDeptLb}
                        disabled={deptLbToggling || deptLbVisible === null}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${deptLbVisible ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        {deptLbToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                        ) : (
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${deptLbVisible ? "translate-x-6" : "translate-x-1"}`} />
                        )}
                      </button>
                    </label>
                    {/* Toggle 2: College leaderboard for this department */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200 cursor-pointer hover:bg-amber-50/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">
                          {collegeLbForDeptVisible === null ? "Loading…" : collegeLbForDeptVisible ? "College leaderboard: Visible to your students" : "College leaderboard: Hidden from your students"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cut off the &ldquo;My College&rdquo; tab for students in YOUR department only. Other departments are unaffected.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleCollegeLbForDept}
                        disabled={collegeLbForDeptToggling || collegeLbForDeptVisible === null}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${collegeLbForDeptVisible ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        {collegeLbForDeptToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                        ) : (
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${collegeLbForDeptVisible ? "translate-x-6" : "translate-x-1"}`} />
                        )}
                      </button>
                    </label>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 p-2">You are not assigned to a department, so these settings are unavailable.</p>
                )}
              </div>
            </div>

            {/* Chat visibility toggles */}
            <div className="pt-3 border-t border-slate-200">
              <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-3">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-cyan-800">
                  <MessageCircle className="w-4 h-4 text-cyan-500" /> Chat Visibility
                </h4>
                <p className="text-[11px] text-cyan-700 mb-2">
                  Control which chat channels your students can see. Messages auto-delete after 24 hours.
                  (Global chat is admin-only.)
                </p>
                <div className="space-y-2">
                  {([
                    { scope: "dept", label: "Department Chat", state: deptChatOn, desc: "Students + mentor in your department" },
                    { scope: "dept-students", label: "Students-Only Chat", state: deptStudentsChatOn, desc: "Students only (no mentor/admin can see it)" },
                    { scope: "dm", label: "Direct Messages", state: dmChatOn, desc: "Private 1:1 chat between students in your department" },
                    { scope: "college", label: "College Chat", state: collegeChatOn, desc: "Everyone in your college" },
                    { scope: "mentor", label: "Mentor Chat", state: mentorChatOn, desc: "Mentors only (your college)" },
                  ] as const).map(({ scope, label, state, desc }) => (
                    <label key={scope} className="flex items-center justify-between p-3 rounded-lg bg-white border border-cyan-200 cursor-pointer hover:bg-cyan-50/50">
                      <div>
                        <div className="text-sm font-bold text-slate-700">
                          {state === null ? "Loading…" : `${label}: ${state ? "ON" : "OFF"}`}
                        </div>
                        <div className="text-[11px] text-slate-500">{desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleChat(scope, state)}
                        disabled={state === null || chatToggling === scope}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${state ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        {chatToggling === scope ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                        ) : (
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${state ? "translate-x-6" : "translate-x-1"}`} />
                        )}
                      </button>
                    </label>
                  ))}
                </div>
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
      // Step 0: Clear your own Firestore data (leaderboard, activityFeed,
      // mockRankings, notes) WHILE STILL AUTHENTICATED. After the Firebase
      // account is deleted below, the Firestore security rules will block
      // all writes, so this must happen first.
      try {
        await cleanupUserFirestore(user.id);
      } catch (e) {
        console.warn("Self-cleanup of Firestore data failed:", e);
      }

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

function StudentRow({ student: s, expanded, onToggle, mentorDepartmentId, onEdit, onDelete, deleting }: any) {
  // A mentor can only manage students in their own department. If the mentor has
  // no department assigned, they can't manage anyone.
  const canManage = !!mentorDepartmentId && s.departmentId === mentorDepartmentId;
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="flex items-stretch">
        <button
          onClick={onToggle}
          className="flex-1 p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left min-w-0"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black shrink-0">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold flex items-center gap-2 flex-wrap">
                {s.name}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{s.username}</span>
                {s.rollNumber && <span className="text-xs text-slate-500">{s.rollNumber}</span>}
                {!s.active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">Inactive</span>
                )}
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

        {/* Manage buttons — only shown for students in the mentor's department */}
        {canManage && (
          <div className="flex items-center gap-1 pr-3 border-l border-slate-100">
            <button
              onClick={onEdit}
              disabled={deleting}
              title="Edit student"
              className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition disabled:opacity-50"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              title="Delete student"
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

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

// ============== STUDENT EDIT MODAL ==============
// Lets a mentor edit a student in their own department. Limited fields only:
// name, phone, roll number, active toggle, and password reset. Department /
// mentor / email changes stay with the admin.
function StudentEditModal({ student, onClose, onSaved }: { student: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: student.name || "",
    phone: student.phone || "",
    rollNumber: student.rollNumber || "",
    active: student.active !== false,
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name cannot be empty"); return; }
    if (form.newPassword && form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        id: student.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim(),
        active: form.active,
      };
      if (form.newPassword) body.password = form.newPassword;
      const res = await fetch("/api/mentor/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update student");
        return;
      }
      toast.success(`${form.name} updated.`);
      onSaved();
    } catch (err) {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-500" /> Edit Student
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={save} className="p-4 space-y-4">
          {/* Read-only identity */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">Username:</span>
              <span className="font-mono font-medium text-slate-800">{student.username || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">Department:</span>
              <span className="font-medium text-slate-800">{student.department?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">Email:</span>
              <span className="font-medium text-slate-800">{student.email || "—"}</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Username, department, and email can only be changed by an admin.
            </p>
          </div>

          {/* Editable fields */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Roll Number</label>
            <input
              type="text"
              value={form.rollNumber}
              onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
              placeholder="KTU register number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          {/* Active toggle */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <div className="text-sm font-bold text-slate-700">Account Active</div>
              <div className="text-[11px] text-slate-500">Inactive students cannot log in.</div>
            </div>
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-5 h-5 accent-emerald-500"
            />
          </label>

          {/* Password reset */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Reset Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.newPassword && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Only students who log in with a username/password will use this. Students who log in via email use Firebase.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
