"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles, Shield, Trophy, BookOpen, Flame, Crown, GraduationCap, Users, ChevronRight } from "lucide-react";

type Role = "ADMIN" | "MENTOR" | "STUDENT";

const ROLE_CONFIG: Record<Role, {
  label: string;
  icon: any;
  tagline: string;
  description: string;
  gradient: string;
  ringColor: string;
  accent: string;
  hint?: string;
}> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    tagline: "Control Center",
    description: "Manage colleges, departments, mentors, students & view analytics",
    gradient: "from-purple-600 via-fuchsia-600 to-pink-600",
    ringColor: "ring-purple-400/50",
    accent: "text-purple-300",
    hint: "Master admin: admin / nptelmoocadmin",
  },
  MENTOR: {
    label: "Mentor",
    icon: GraduationCap,
    tagline: "Guide & Track",
    description: "Monitor your students' progress, activity and test scores",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    ringColor: "ring-emerald-400/50",
    accent: "text-emerald-300",
  },
  STUDENT: {
    label: "Student",
    icon: BookOpen,
    tagline: "Play & Learn",
    description: "Practice MCQs, take mock tests, earn XP, badges & climb the leaderboard",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    ringColor: "ring-amber-400/50",
    accent: "text-amber-300",
  },
};

export function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [role, setRole] = useState<Role>("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed", {
          description: res.status === 403 && !data.error?.includes("deactivated")
            ? "Please make sure you're using the correct portal for your account type."
            : undefined,
        });
        return;
      }
      toast.success(`Welcome, ${data.user.name}! 🎉`, {
        description: `Logged in as ${data.user.role.toLowerCase()}`,
      });
      onLogin(data.user);
    } catch (err) {
      toast.error("Network error", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f1c3f] text-white flex items-center justify-center px-4 py-8">
      {/* Animated background grid */}
      <div className="absolute inset-0 cq-grid-bg opacity-50" />
      {/* Floating blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pink-500/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Floating icons */}
      <motion.div className="absolute top-20 left-20 text-purple-300/30" animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <Shield className="w-12 h-12" />
      </motion.div>
      <motion.div className="absolute top-32 right-24 text-pink-300/30" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
        <Trophy className="w-10 h-10" />
      </motion.div>
      <motion.div className="absolute bottom-32 left-24 text-amber-300/30" animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}>
        <BookOpen className="w-11 h-11" />
      </motion.div>
      <motion.div className="absolute bottom-20 right-32 text-orange-300/30" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, delay: 1.5 }}>
        <Flame className="w-10 h-10" />
      </motion.div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 mb-3 cq-glow"
          >
            <span className="text-3xl">⚖️</span>
          </motion.div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
            Constitution Quest
          </h1>
          <p className="text-white/50 text-xs mt-1">Gamified NPTEL Learning Platform • IES College of Engineering</p>
        </div>

        {/* Role selector tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
            const cfg = ROLE_CONFIG[r];
            const RIcon = cfg.icon;
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setUsername(""); setPassword(""); }}
                className={`relative p-3 rounded-2xl border-2 transition-all ${
                  active
                    ? `bg-gradient-to-br ${cfg.gradient} border-white/30 cq-glow`
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <RIcon className={`w-5 h-5 mx-auto mb-1 ${active ? "text-white" : "text-white/50"}`} />
                <div className={`text-xs font-bold ${active ? "text-white" : "text-white/60"}`}>{cfg.label}</div>
              </button>
            );
          })}
        </div>

        {/* Login card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 cq-glow"
          >
            {/* Role header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">{config.label}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Portal</span>
                </div>
                <div className={`text-xs ${config.accent} font-medium`}>{config.tagline}</div>
              </div>
            </div>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">{config.description}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Enter your ${role.toLowerCase()} username`}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-base tracking-wide shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Entering {config.label} Portal...</>
                ) : (
                  <>Login to {config.label} Portal <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            {config.hint && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-start gap-2 text-[11px] text-white/50">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-white/60 font-medium">Demo:</span>{" "}
                    <code className="text-amber-300 bg-white/5 px-1.5 py-0.5 rounded">admin</code>
                    {" / "}
                    <code className="text-amber-300 bg-white/5 px-1.5 py-0.5 rounded">nptelmoocadmin</code>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Helper text */}
        <div className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
          {role === "STUDENT" && "👥 Your mentor or admin created your account. Check with them for your login."}
          {role === "MENTOR" && "🎓 Your admin created your account. Contact your college admin for login credentials."}
          {role === "ADMIN" && "🛡️ Only the master admin can log in here. Admins create all other accounts."}
        </div>
      </div>
    </div>
  );
}
