"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, Sparkles, Shield, Trophy, BookOpen, Flame, GraduationCap, ChevronRight,
  UserPlus, LogIn, AlertCircle, AtSign, Key, User, Building2, Hash, Phone, Eye, EyeOff,
  Mail, ArrowLeft, Send, CheckCircle2, HelpCircle
} from "lucide-react";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { syncUserProfile, syncLeaderboardClient, addActivityClient } from "@/lib/firestore";

type Role = "ADMIN" | "MENTOR" | "STUDENT";
type Mode = "login" | "signup";

const ROLE_CONFIG: Record<Role, {
  label: string;
  icon: any;
  tagline: string;
  description: string;
  gradient: string;
  accent: string;
  hint?: string;
  firebaseEnabled: boolean;
  dualMode?: boolean; // true = supports BOTH username/password AND email/password login
}> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    tagline: "Main & Sub-Admins",
    description: "Main admin can login with email & password OR username & password. Sub-admins use username & password only.",
    gradient: "from-purple-600 via-fuchsia-600 to-pink-600",
    accent: "text-purple-300",
    // hint removed — no demo credentials shown
    firebaseEnabled: true,
    dualMode: true,
  },
  MENTOR: {
    label: "Mentor",
    icon: GraduationCap,
    tagline: "Guide Students",
    description: "Sign up with your college email & password. Monitor your students' progress, activity and test scores.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    accent: "text-emerald-300",
    firebaseEnabled: true,
  },
  STUDENT: {
    label: "Student",
    icon: BookOpen,
    tagline: "Play & Learn",
    description: "Sign up with your college email & password. Practice MCQs, take mock tests, earn XP, badges & climb the leaderboard!",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accent: "text-amber-300",
    firebaseEnabled: true,
  },
};

export function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("STUDENT");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // For admin dual-mode: "email" = Firebase email/password, "username" = local username/password
  const [adminLoginMethod, setAdminLoginMethod] = useState<"email" | "username">("email");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Google sign-in state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Signup form state
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [signupForm, setSignupForm] = useState({
    name: "",
    collegeId: "",
    departmentId: "",
    mentorId: "",
    rollNumber: "",
    phone: "",
  });

  // Reset state when role or mode changes
  useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSignupForm({ name: "", collegeId: "", departmentId: "", mentorId: "", rollNumber: "", phone: "" });
    // Default admin login method to "email" (Firebase) since main admin uses Firebase
    setAdminLoginMethod("email");
    // Reset forgot password state
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
  }, [role, mode]);

  // Load colleges for signup
  useEffect(() => {
    if (mode !== "signup" || !ROLE_CONFIG[role].firebaseEnabled) return;
    (async () => {
      try {
        const res = await fetch("/api/public/colleges");
        const data = await res.json();
        setColleges(data.colleges || []);
      } catch (e) {
        console.error("Failed to load colleges", e);
      }
    })();
  }, [mode, role]);

  // Load departments when college changes
  useEffect(() => {
    if (!signupForm.collegeId) {
      setDepartments([]);
      setMentors([]);
      return;
    }
    (async () => {
      try {
        const dRes = await fetch(`/api/public/departments?collegeId=${signupForm.collegeId}`);
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    })();
  }, [signupForm.collegeId]);

  // Load mentors when department changes (department-specific)
  useEffect(() => {
    if (!signupForm.collegeId || !signupForm.departmentId) {
      setMentors([]);
      return;
    }
    (async () => {
      try {
        const mRes = await fetch(`/api/public/mentors?collegeId=${signupForm.collegeId}&departmentId=${signupForm.departmentId}`);
        const mData = await mRes.json();
        setMentors(mData.mentors || []);
      } catch (e) {
        console.error("Failed to load mentors", e);
      }
    })();
  }, [signupForm.collegeId, signupForm.departmentId]);

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  // ======== LOGIN HANDLER ========
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Determine whether to use Firebase (email) or local (username) login
      // - Admin in dual-mode: depends on adminLoginMethod toggle
      // - Admin NOT in dual-mode (legacy): use username
      // - Mentor/Student with firebaseEnabled: use Firebase email/password
      // - Otherwise: local username/password
      const useFirebase = config.dualMode
        ? (adminLoginMethod === "email")
        : config.firebaseEnabled;

      if (useFirebase) {
        // Firebase email/password login
        if (!auth) {
          toast.error("Authentication service not available. Please refresh the page.");
          return;
        }
        if (!email || !password) {
          toast.error("Email and password are required");
          return;
        }
        // 1. Sign in with Firebase
        let cred: FirebaseUser | null = null;
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          cred = userCred.user;
        } catch (err: any) {
          const code = err?.code || "";
          let msg = "Login failed";
          if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            // Could be a Google-only account — check if the email exists with Google provider
            msg = "Invalid email or password. If you signed up with Google, please use 'Continue with Google' below.";
          } else if (code === "auth/too-many-requests") {
            msg = "Too many failed attempts. Try again later.";
          } else if (code === "auth/invalid-email") {
            msg = "Invalid email format";
          } else if (code === "auth/network-request-failed") {
            msg = "Network error. Check your connection.";
          } else {
            msg = err?.message || "Login failed";
          }
          toast.error(msg, {
            description: "Try 'Continue with Google' if you signed up with Google.",
          });
          return;
        }
        // 2. Get ID token and send to backend
        const idToken = await cred.getIdToken();
        const res = await fetch("/api/auth/firebase-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          // Sign out from Firebase since backend rejected
          if (auth) await auth.signOut();
          // If profile is incomplete, switch to signup mode with email pre-filled
          if (data.error && data.error.includes("incomplete")) {
            toast.info("Complete your registration", {
              description: "Your email is registered but profile is incomplete. Please fill in the Sign Up form to complete your account.",
            });
            setMode("signup");
            setRole("STUDENT");
            // Email is already set from the login form — it stays in the email state
            return;
          }
          toast.error(data.error || "Login failed");
          return;
        }
        toast.success(`Welcome, ${data.user.name}! 🎉`, {
          description: `Logged in as ${data.user.role.toLowerCase()}`,
        });
        // Sync user profile to Firestore (for security rules)
        if (cred) {
          await syncUserProfile({
            id: data.user.id,
            name: data.user.name,
            role: data.user.role,
            collegeId: data.user.collegeId,
            collegeCode: data.user.college?.code,
            collegeName: data.user.college?.name,
            username: data.user.username,
            email: data.user.email,
            firebaseUid: cred.uid,
          });
          // Sync leaderboard if student
          if (data.user.role === "STUDENT") {
            await syncLeaderboardClient({
              id: data.user.id,
              name: data.user.name,
              username: data.user.username,
              xp: data.user.xp || 0,
              level: data.user.level || 1,
              streak: data.user.streak || 0,
              collegeCode: data.user.college?.code,
              collegeName: data.user.college?.name,
            });
          }
          // Add login activity to Firestore
          await addActivityClient({
            userId: data.user.id,
            userName: data.user.name,
            userRole: data.user.role,
            action: "login",
            details: "method=email",
            collegeCode: data.user.college?.code,
            collegeName: data.user.college?.name,
          });
        }
        // Wait briefly to ensure the session cookie is fully processed by the browser
        await new Promise(r => setTimeout(r, 300));
        onLogin(data.user);
      } else {
        // Local username/password login (admin & sub-admin)
        if (!username || !password) {
          toast.error("Username and password are required");
          return;
        }
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
          description: `Logged in as ${data.user.role === "SUB_ADMIN" ? "sub-admin" : data.user.role.toLowerCase()}`,
        });
        // Wait briefly to ensure the session cookie is fully processed by the browser
        await new Promise(r => setTimeout(r, 300));
        onLogin(data.user);
      }
    } catch (err: any) {
      toast.error("Network error", { description: "Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  // ======== SIGNUP HANDLER ========
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) {
      toast.error("Authentication service not available. Please refresh the page.");
      return;
    }
    // Validate required fields
    if (!signupForm.name.trim()) { toast.error("Please enter your full name"); return; }
    if (!signupForm.collegeId) { toast.error("Please select your college"); return; }
    if (!signupForm.departmentId) { toast.error("Please select your department"); return; }
    if (role === "STUDENT" && !signupForm.rollNumber.trim()) { toast.error("Please enter your KTU register number"); return; }
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email address"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    try {
      // 1. Create Firebase account
      let cred: FirebaseUser | null = null;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        cred = userCred.user;
      } catch (err: any) {
        const code = err?.code || "";
        let msg = "Sign up failed";
        if (code === "auth/email-already-in-use") {
          // Email exists in Firebase but may not have a DB record.
          // Try signing in with the provided credentials, then continue with signup.
          try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            cred = userCred.user;
            // Continue to DB signup below with the existing Firebase account
          } catch (signInErr: any) {
            const signInCode = signInErr?.code || "";
            if (signInCode === "auth/invalid-credential" || signInCode === "auth/wrong-password") {
              msg = "This email is already registered with a different password. Please sign in with your existing password, or use 'Forgot Password' to reset it.";
            } else if (signInCode === "auth/too-many-requests") {
              msg = "Too many attempts. Please try again later or use 'Forgot Password'.";
            } else {
              msg = "This email is already registered. Please try signing in instead.";
            }
            toast.error(msg);
            return;
          }
        } else if (code === "auth/invalid-email") {
          msg = "Invalid email format";
        } else if (code === "auth/weak-password") {
          msg = "Password is too weak (min 6 characters)";
        } else if (code === "auth/network-request-failed") {
          msg = "Network error. Check your connection.";
        } else {
          msg = err?.message || "Sign up failed";
        }
        if (!cred) {
          toast.error(msg);
          return;
        }
      }
      // 2. Get ID token
      const idToken = await cred.getIdToken();
      // 3. Send to backend to create User record
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          email,
          role,
          name: signupForm.name,
          collegeId: signupForm.collegeId,
          departmentId: signupForm.departmentId,
          mentorId: signupForm.mentorId || undefined,
          rollNumber: role === "STUDENT" ? signupForm.rollNumber : undefined,
          phone: signupForm.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Sign out from Firebase since backend failed
        if (auth) await auth.signOut();
        toast.error(data.error || "Sign up failed");
        return;
      }
      toast.success(`Welcome, ${data.user.name}! 🎉`, {
        description: "Your account has been created successfully!",
      });
      // Sync user profile to Firestore
      if (cred) {
        await syncUserProfile({
          id: data.user.id, name: data.user.name, role: data.user.role,
          collegeId: data.user.collegeId, collegeCode: data.user.college?.code,
          collegeName: data.user.college?.name, username: data.user.username,
          email: data.user.email, firebaseUid: cred.uid,
        });
        if (data.user.role === "STUDENT") {
          await syncLeaderboardClient({
            id: data.user.id, name: data.user.name, username: data.user.username,
            xp: 0, level: 1, streak: 1,
            collegeCode: data.user.college?.code, collegeName: data.user.college?.name,
          });
        }
        await addActivityClient({
          userId: data.user.id, userName: data.user.name, userRole: data.user.role,
          action: "signup", details: "method=email",
          collegeCode: data.user.college?.code, collegeName: data.user.college?.name,
        });
      }
      await new Promise(r => setTimeout(r, 300));
      onLogin(data.user);
    } catch (err: any) {
      toast.error("Network error", { description: "Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  // ======== FORGOT PASSWORD HANDLER ========
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setResetSending(true);
    try {
      if (!auth) {
        toast.error("Authentication service not available. Please refresh the page.");
        return;
      }
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
      toast.success("Password reset email sent!", {
        description: `Check ${resetEmail} for instructions to reset your password.`,
      });
    } catch (err: any) {
      const code = err?.code || "";
      let msg = "Failed to send reset email";
      if (code === "auth/user-not-found") {
        // For security, Firebase doesn't reveal if email exists. But we can show a success-like message.
        setResetSent(true);
        toast.success("If an account exists with this email, a reset link has been sent.", {
          description: "Check your inbox and spam folder.",
        });
        return;
      } else if (code === "auth/invalid-email") {
        msg = "Invalid email format";
      } else if (code === "auth/network-request-failed") {
        msg = "Network error. Check your connection.";
      } else {
        msg = err?.message || "Failed to send reset email";
      }
      toast.error(msg);
    } finally {
      setResetSending(false);
    }
  }

  // ======== GOOGLE SIGN-IN HANDLER (LOGIN) ========
  async function handleGoogleLogin() {
    if (!auth) {
      toast.error("Authentication service not available. Please refresh the page.");
      return;
    }
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // Send to backend to verify and create session
      const res = await fetch("/api/auth/firebase-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Sign out from Firebase since backend rejected
        if (auth) await auth.signOut();
        // If profile is incomplete, switch to signup mode
        if (data.error && data.error.includes("incomplete")) {
          toast.info("Complete your registration", {
            description: "Your Google account is registered but profile is incomplete. Please fill in the Sign Up form to complete your account.",
          });
          setMode("signup");
          setRole("STUDENT");
          // Set email from Google account
          if (result.user.email) setEmail(result.user.email);
          return;
        }
        toast.error(data.error || "Google login failed");
        return;
      }
      toast.success(`Welcome, ${data.user.name}! 🎉`, {
        description: `Logged in as ${data.user.role.toLowerCase()}`,
      });
      // Sync user profile to Firestore
      await syncUserProfile({
        id: data.user.id, name: data.user.name, role: data.user.role,
        collegeId: data.user.collegeId, collegeCode: data.user.college?.code,
        collegeName: data.user.college?.name, username: data.user.username,
        email: data.user.email, firebaseUid: result.user.uid,
      });
      if (data.user.role === "STUDENT") {
        await syncLeaderboardClient({
          id: data.user.id, name: data.user.name, username: data.user.username,
          xp: data.user.xp || 0, level: data.user.level || 1, streak: data.user.streak || 0,
          collegeCode: data.user.college?.code, collegeName: data.user.college?.name,
        });
      }
      await addActivityClient({
        userId: data.user.id, userName: data.user.name, userRole: data.user.role,
        action: "login", details: "method=google",
        collegeCode: data.user.college?.code, collegeName: data.user.college?.name,
      });
      await new Promise(r => setTimeout(r, 300));
      onLogin(data.user);
    } catch (err: any) {
      const code = err?.code || "";
      let msg = "Google sign-in failed";
      if (code === "auth/popup-closed-by-user") {
        msg = "Google sign-in popup was closed. Please try again.";
      } else if (code === "auth/popup-blocked") {
        msg = "Popup was blocked by the browser. Please allow popups and try again.";
      } else if (code === "auth/cancelled-popup-request") {
        return; // Silent — user opened another popup
      } else if (code === "auth/network-request-failed") {
        msg = "Network error. Check your connection.";
      } else {
        msg = err?.message || "Google sign-in failed";
      }
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  // ======== GOOGLE SIGN-UP HANDLER ========
  // For signup, we first validate the form fields, then do Google sign-in to create the Firebase account,
  // then send the ID token + profile data to our signup API.
  async function handleGoogleSignup() {
    if (!auth) {
      toast.error("Authentication service not available. Please refresh the page.");
      return;
    }
    // Validate required fields first (same as email/password signup)
    if (!signupForm.name.trim()) { toast.error("Please enter your full name"); return; }
    if (!signupForm.collegeId) { toast.error("Please select your college"); return; }
    if (!signupForm.departmentId) { toast.error("Please select your department"); return; }
    if (role === "STUDENT" && !signupForm.rollNumber.trim()) { toast.error("Please enter your KTU register number"); return; }

    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      // Use the Google account's email
      const googleEmail = user.email || "";

      // Send to backend to create User record
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          email: googleEmail,
          role,
          name: signupForm.name,
          collegeId: signupForm.collegeId,
          departmentId: signupForm.departmentId,
          mentorId: signupForm.mentorId || undefined,
          rollNumber: role === "STUDENT" ? signupForm.rollNumber : undefined,
          phone: signupForm.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Sign out from Firebase since backend failed
        if (auth) await auth.signOut();
        toast.error(data.error || "Sign up failed");
        return;
      }
      toast.success(`Welcome, ${data.user.name}! 🎉`, {
        description: "Your account has been created successfully!",
      });
      // Sync user profile to Firestore (for security rules)
      if (user) {
        await syncUserProfile({
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          collegeId: data.user.collegeId,
          collegeCode: data.user.college?.code,
          collegeName: data.user.college?.name,
          username: data.user.username,
          email: data.user.email,
          firebaseUid: user.uid,
        });
        // Sync leaderboard if student
        if (data.user.role === "STUDENT") {
          await syncLeaderboardClient({
            id: data.user.id,
            name: data.user.name,
            username: data.user.username,
            xp: 0,
            level: 1,
            streak: 1,
            collegeCode: data.user.college?.code,
            collegeName: data.user.college?.name,
          });
        }
        // Add signup activity
        await addActivityClient({
          userId: data.user.id,
          userName: data.user.name,
          userRole: data.user.role,
          action: "signup",
          details: "method=google",
          collegeCode: data.user.college?.code,
          collegeName: data.user.college?.name,
        });
      }
      await new Promise(r => setTimeout(r, 300));
      onLogin(data.user);
    } catch (err: any) {
      const code = err?.code || "";
      let msg = "Google sign-up failed";
      if (code === "auth/popup-closed-by-user") {
        msg = "Google sign-up popup was closed. Please try again.";
      } else if (code === "auth/popup-blocked") {
        msg = "Popup was blocked by the browser. Please allow popups and try again.";
      } else if (code === "auth/cancelled-popup-request") {
        return;
      } else if (code === "auth/network-request-failed") {
        msg = "Network error. Check your connection.";
      } else {
        msg = err?.message || "Google sign-up failed";
      }
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center px-4 py-8" style={{ backgroundColor: "#1a0b2e", backgroundImage: "linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #0f1c3f 100%)", minHeight: "100vh", WebkitOverflowScrolling: "touch" }}>
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

      <div className="relative z-10 w-full max-w-md sm:max-w-md mx-auto" style={{ maxWidth: "min(448px, calc(100vw - 2rem))" }}>
        {/* Brand */}
        <div className="text-center mb-5">
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

        {/* Login / Sign Up toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition ${
              mode === "login" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setRole("STUDENT"); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition ${
              mode === "signup" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>

        {/* Role selector tabs */}
        <div className={`grid gap-2 mb-4 ${mode === "signup" ? "grid-cols-1" : "grid-cols-3"}`}>
          {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
            const cfg = ROLE_CONFIG[r];
            const RIcon = cfg.icon;
            const active = role === r;
            // In signup mode, hide Admin and Mentor (created by admin only)
            if (mode === "signup" && (r === "ADMIN" || r === "MENTOR")) return null;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); }}
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

        {/* Login/Signup card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${role}`}
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
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    {mode === "login" ? "Portal" : "Sign Up"}
                  </span>
                </div>
                <div className={`text-xs ${config.accent} font-medium`}>{config.tagline}</div>
              </div>
            </div>

            {mode === "login" ? (
              <>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">{config.description}</p>
                {/* Admin dual-mode toggle: Email (Firebase) vs Username (Local) */}
                {config.dualMode && (
                  <div className="grid grid-cols-2 gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAdminLoginMethod("email")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        adminLoginMethod === "email" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <AtSign className="w-3.5 h-3.5" /> Email (Main Admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminLoginMethod("username")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        adminLoginMethod === "username" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> Username (Sub-Admin)
                    </button>
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-3">
                  {(config.dualMode ? adminLoginMethod === "email" : config.firebaseEnabled) ? (
                    <>
                      {/* Email/Password for Firebase login */}
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Email</label>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                            required
                            autoComplete="email"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition"
                            required
                            autoComplete="current-password"
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
                    </>
                  ) : (
                    <>
                      {/* Username/Password for admin login */}
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Username</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={`Enter your ${role.toLowerCase()} username`}
                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                            required
                            autoComplete="username"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition"
                            required
                            autoComplete="current-password"
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
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-base tracking-wide shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Entering...</>
                    ) : (
                      <>Login to {config.label} Portal <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>

                {/* Google Sign-In button (login mode only, for Firebase-enabled roles) */}
                {mode === "login" && (config.dualMode ? adminLoginMethod === "email" : config.firebaseEnabled) && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">or</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading || loading}
                      className="w-full py-3 rounded-xl bg-white text-slate-700 font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                    >
                      {googleLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin text-slate-500" /> Connecting to Google...</>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </button>
                  </>
                )}

              </>
            ) : (
              <>
                {/* SIGN UP FORM */}
                <p className="text-xs text-white/60 mb-4 leading-relaxed">{config.description}</p>
                <form onSubmit={handleSignup} className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* College */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">College *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                      <select
                        value={signupForm.collegeId}
                        onChange={(e) => setSignupForm(f => ({ ...f, collegeId: e.target.value, departmentId: "", mentorId: "" }))}
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition appearance-none"
                        required
                      >
                        <option value="">— Select your college —</option>
                        {colleges.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Department *</label>
                    <select
                      value={signupForm.departmentId}
                      onChange={(e) => setSignupForm(f => ({ ...f, departmentId: e.target.value }))}
                      disabled={!signupForm.collegeId}
                      className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">{signupForm.collegeId ? "— Select department —" : "Select college first"}</option>
                      {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-800">{d.name} ({d.code})</option>)}
                    </select>
                  </div>
                  {/* Mentor (filtered by department) */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Mentor *</label>
                    <select
                      value={signupForm.mentorId}
                      onChange={(e) => setSignupForm(f => ({ ...f, mentorId: e.target.value }))}
                      disabled={!signupForm.departmentId}
                      className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">{signupForm.departmentId ? "— Select your mentor —" : "Select department first"}</option>
                      {mentors.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-800">{m.name}</option>
                      ))}
                    </select>
                    {signupForm.departmentId && mentors.length === 0 && (
                      <p className="text-[10px] text-amber-300 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> No mentors assigned to this department yet. Please contact your admin.
                      </p>
                    )}
                  </div>
                  {/* KTU Register Number (students only) */}
                  {role === "STUDENT" && (
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1.5">KTU Register Number *</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={signupForm.rollNumber}
                          onChange={(e) => setSignupForm(f => ({ ...f, rollNumber: e.target.value }))}
                          placeholder="e.g., IES23CSE045"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {/* Phone (optional) */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="tel"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Your phone number"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                      />
                    </div>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Email *</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Password * <span className="text-white/40">(min 6 characters)</span></label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition"
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
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none focus:ring-2 transition ${
                          confirmPassword && confirmPassword !== password
                            ? "border-red-400 focus:ring-red-400/30"
                            : "border-white/15 focus:border-pink-400 focus:ring-pink-400/30"
                        }`}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[10px] text-red-300 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Passwords do not match
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold text-base tracking-wide shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Creating your account...</>
                    ) : (
                      <><UserPlus className="w-5 h-5" /> Create {config.label} Account</>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Helper text */}
        <div className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
          {mode === "login" ? (
            <>
              {role === "STUDENT" && "📧 Students sign in with email & password. Admin-issued credentials also work — just use the username in the email field."}
              {role === "MENTOR" && "🎓 Mentors sign in with their college email & password."}
              {role === "ADMIN" && "🛡️ Main admin & sub-admins use username + password issued by the main admin."}
            </>
          ) : (
            <>
              {role === "STUDENT" && "📋 Fill all required fields. Your KTU register number helps your mentor identify you."}
              {role === "MENTOR" && "📋 Fill all required fields. Students will be able to select you as their mentor during signup."}
            </>
          )}
        </div>

        {/* Forgot Password & Sign Up links */}
        {mode === "login" && (
          <div className="mt-2 text-center text-[11px] flex items-center justify-center gap-3 flex-wrap">
            {/* Forgot Password link — only for Firebase-enabled roles (Student, Mentor) and Admin in email mode */}
            {((config.dualMode ? adminLoginMethod === "email" : config.firebaseEnabled)) && (
              <button
                onClick={() => { setShowForgotPassword(true); setResetEmail(email || ""); setResetSent(false); }}
                className="text-pink-300 hover:text-pink-200 underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> Forgot Password?
              </button>
            )}
            {role !== "ADMIN" && (
              <button onClick={() => { setMode("signup"); setRole("STUDENT"); }} className="text-purple-300 hover:text-purple-200 underline">
                Don't have an account? Sign up
              </button>
            )}
          </div>
        )}
        {mode === "signup" && (
          <div className="mt-2 text-center text-[11px]">
            <button onClick={() => setMode("login")} className="text-purple-300 hover:text-purple-200 underline">
              Already have an account? Sign in
            </button>
          </div>
        )}
      </div>

      {/* ======== FORGOT PASSWORD MODAL ======== */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-[#1e1338] to-[#15102e] border border-white/15 rounded-3xl p-6 w-full max-w-md cq-glow"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Mail className="w-5 h-5 text-pink-300" /> Reset Password
                </h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {!resetSent ? (
                <>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">
                    Enter your registered email address and we'll send you a link to reset your password.
                    This works for <strong className="text-white/80">email accounts</strong> (students & mentors who signed up with email).
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1.5">Email Address</label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={resetSending}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition disabled:opacity-60"
                    >
                      {resetSending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Send Reset Link</>
                      )}
                    </button>
                  </form>
                  <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-[11px] text-blue-200/80 leading-relaxed">
                    <strong className="text-blue-200">Admin/Sub-Admin accounts:</strong> If you login with a username (not email), please contact the main admin to reset your password. The main admin can reset it from the admin dashboard.
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h4 className="font-bold text-base mb-2">Check Your Email</h4>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">
                    If an account exists for <strong className="text-white/80">{resetEmail}</strong>, a password reset link has been sent. Check your inbox and spam folder.
                  </p>
                  <p className="text-[11px] text-white/40 mb-4">
                    The reset link will expire in 1 hour. After resetting your password, come back here to sign in.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResetSent(false); setResetEmail(""); }}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm hover:bg-white/15 transition"
                    >
                      Try Another Email
                    </button>
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm"
                    >
                      Back to Login
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
