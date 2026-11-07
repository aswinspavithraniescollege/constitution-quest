"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { LoginScreen } from "@/components/login-screen";
import { StudentApp } from "@/components/student-app";
import { AdminDashboard } from "@/components/admin-dashboard";
import { MentorDashboard } from "@/components/mentor-dashboard";
import { MentorOnboarding } from "@/components/mentor-onboarding";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth", { credentials: "same-origin" });
        const data = await res.json();
        setUser(data.user);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogin(u: any) {
    // Verify the session is set by calling GET /api/auth
    // This ensures the cookie is fully processed by the browser
    // before the dashboard renders and starts making API calls
    try {
      const res = await fetch("/api/auth", { credentials: "same-origin" });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return;
      }
    } catch {
      // If verification fails, fall back to the login response user
    }
    // Fallback: use the user from the login response
    setUser(u);
  }

  function handleLogout() {
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", minHeight: "100vh" }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // First-time onboarding for mentors, sub-admins AND guests: the admin-issued
  // temp username/password is only a gateway to reach this setup screen, where
  // they set their own email & password (authMethod upgrades LOCAL -> FIREBASE).
  if (
    (user.role === "MENTOR" || user.role === "SUB_ADMIN" || user.role === "GUEST") &&
    user.authMethod === "LOCAL"
  ) {
    return (
      <MentorOnboarding
        user={user}
        onDone={handleLogin}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "ADMIN" || user.role === "SUB_ADMIN") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === "MENTOR") {
    return <MentorDashboard user={user} onLogout={handleLogout} />;
  }

  // STUDENT and GUEST both use the StudentApp — guests get the same practice/
  // mock-test interface but are excluded from leaderboards (filtered by role).
  return <StudentApp user={user} onLogout={handleLogout} />;
}
