"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, Shield, GraduationCap, AtSign, Key, Eye, EyeOff,
  CheckCircle2, ArrowRight, Building2, User as UserIcon, LogOut, Users as UsersIcon,
} from "lucide-react";
import {
  auth,
  createUserWithEmailAndPassword,
} from "@/lib/firebase";
import { syncUserProfile, addActivityClient } from "@/lib/firestore";

type OnboardUser = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  authMethod: string;
  role: string;
  college?: { name: string; code: string } | null;
  department?: { name: string; code: string } | null;
};

// Helper to pick role-specific styling
function roleStyle(role: string) {
  if (role === "SUB_ADMIN") {
    return {
      gradient: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-600 via-pink-600 to-fuchsia-600",
      tint: "bg-purple-500/5 border-purple-500/20",
      textTint: "text-purple-300/70",
      iconTint: "text-purple-300/60",
      accentText: "text-purple-300",
      label: "Sub-Admin",
      Icon: Shield,
      glow1: "bg-purple-500/20",
      glow2: "bg-pink-500/10",
      bg: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    };
  }
  if (role === "GUEST") {
    return {
      gradient: "from-sky-500 to-blue-500",
      bgGradient: "from-sky-500 via-blue-500 to-indigo-500",
      tint: "bg-sky-500/5 border-sky-500/20",
      textTint: "text-sky-300/70",
      iconTint: "text-sky-300/60",
      accentText: "text-sky-300",
      label: "Guest",
      Icon: UsersIcon,
      glow1: "bg-sky-500/20",
      glow2: "bg-blue-500/10",
      bg: "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #0f172a 100%)",
    };
  }
  // MENTOR (default)
  return {
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500 via-teal-500 to-cyan-500",
    tint: "bg-emerald-500/5 border-emerald-500/20",
    textTint: "text-emerald-300/70",
    iconTint: "text-emerald-300/60",
    accentText: "text-emerald-300",
    label: "Mentor",
    Icon: GraduationCap,
    glow1: "bg-emerald-500/20",
    glow2: "bg-teal-500/10",
    bg: "linear-gradient(135deg, #0f172a 0%, #042f2e 50%, #0f172a 100%)",
  };
}

// MentorOnboarding — shown when a mentor/sub-admin/guest logs in for the first
// time using the admin-issued temp username & password (authMethod=LOCAL).
// Here they set up their own email & password, which creates a Firebase account
// and upgrades their DB record so the temp credentials stop working.
export function MentorOnboarding({
  user,
  onDone,
  onLogout,
}: {
  user: OnboardUser;
  onDone: (user: OnboardUser) => void;
  onLogout: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const style = roleStyle(user.role);
  const RoleIcon = style.Icon;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!auth) {
      toast.error("Authentication service not available. Please refresh the page.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Firebase account with the user's own email + password
      let idToken: string;
      let firebaseUid: string;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        idToken = await cred.user.getIdToken();
        firebaseUid = cred.user.uid;
      } catch (err: any) {
        const code = err?.code || "";
        let msg = "Could not create your account.";
        if (code === "auth/email-already-in-use") {
          msg = "This email is already registered with Firebase. Please use a different email, or log out and use the Email tab to sign in if it's yours.";
        } else if (code === "auth/invalid-email") {
          msg = "Invalid email format.";
        } else if (code === "auth/weak-password") {
          msg = "Password is too weak. Please choose a stronger password (at least 6 characters).";
        } else if (code === "auth/network-request-failed") {
          msg = "Network error. Check your connection and try again.";
        } else {
          msg = err?.message || msg;
        }
        toast.error(msg);
        return;
      }

      // 2. Tell the backend to upgrade this user's DB record
      const res = await fetch("/api/auth/mentor-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The Firebase account was created but the DB upgrade failed.
        // Tell the user to log out and use the Email tab with their new
        // email & password — the existing firebase-login fallback will link
        // their firebaseUid to this DB record on the next email login.
        toast.error(data.error || "Setup failed on the server.", {
          description: "Your Firebase account was created. Please log out, then use the Email tab to sign in with your new email & password.",
          duration: 8000,
        });
        // Sign them out so they can re-authenticate cleanly via Email login
        try { await auth.signOut(); } catch {}
        onLogout();
        return;
      }

      // 3. Sync the upgraded profile to Firestore
      try {
        await syncUserProfile({
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          collegeId: data.user.collegeId,
          collegeCode: data.user.college?.code,
          collegeName: data.user.college?.name,
          departmentId: data.user.departmentId,
          deptCode: data.user.department?.code,
          username: data.user.username,
          email: data.user.email,
          firebaseUid,
        });
        await addActivityClient({
          userId: data.user.id,
          userName: data.user.name,
          userRole: data.user.role,
          action: "mentor_onboard",
          details: `email=${data.user.email}`,
          collegeCode: data.user.college?.code,
          collegeName: data.user.college?.name,
        });
      } catch {
        // non-fatal — Firestore sync is best-effort
      }

      toast.success("Account set up! Welcome aboard. 🎉", {
        description: "Your email & password are ready. Use them to log in from now on.",
      });

      // Brief pause so the session cookie + toast settle, then transition
      await new Promise(r => setTimeout(r, 300));
      onDone(data.user);
    } catch (err: any) {
      toast.error("Something went wrong", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (auth) {
      auth.signOut().catch(() => {});
    }
    onLogout();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: "#0f172a",
        backgroundImage: style.bg,
        minHeight: "100vh",
      }}
    >
      {/* glow */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${style.glow1} rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${style.glow2} rounded-full blur-3xl pointer-events-none`} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
              <RoleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Set Up Your {style.label} Account
              </h1>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${style.textTint}`}>
                One-time setup
              </span>
            </div>
          </div>

          {/* Read-only identity summary */}
          <div className={`mb-5 p-3 rounded-xl ${style.tint} border space-y-1.5`}>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <UserIcon className={`w-3.5 h-3.5 ${style.iconTint}`} />
              <span className="text-white/40">Name:</span>
              <span className="font-medium text-white">{user.name}</span>
            </div>
            {user.username && (
              <div className="flex items-center gap-2 text-xs text-white/70">
                <AtSign className={`w-3.5 h-3.5 ${style.iconTint}`} />
                <span className="text-white/40">Temp username:</span>
                <span className="font-mono text-white/80">{user.username}</span>
              </div>
            )}
            {user.college && (
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Building2 className={`w-3.5 h-3.5 ${style.iconTint}`} />
                <span className="text-white/40">College:</span>
                <span className="text-white/80">{user.college.name}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-white/60 mb-5 leading-relaxed">
            Choose your own email and password. From now on you&apos;ll use these to log in —
            the temporary username your admin issued will stop working.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Your Email <span className={style.accentText}>*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Password <span className={style.accentText}>*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Confirm Password <span className={style.accentText}>*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* What happens next */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <CheckCircle2 className={`w-3.5 h-3.5 ${style.accentText} mt-0.5 shrink-0`} />
              <p className="text-[10px] text-white/50 leading-relaxed">
                We&apos;ll create a secure account with your email & password. Your temporary
                username will be disabled immediately after setup.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${style.bgGradient} text-white font-bold text-base tracking-wide shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Setting up...</>
              ) : (
                <>Complete Setup <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-white/40 hover:text-white/70 inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" /> Cancel & log out
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/30 mt-4">
          <Shield className="w-3 h-3 inline mr-1" />
          Secured by Constitution Quest
        </p>
      </motion.div>
    </div>
  );
}
