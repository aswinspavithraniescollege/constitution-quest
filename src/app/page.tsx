"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { LoginScreen } from "@/components/login-screen";
import { StudentApp } from "@/components/student-app";
import { AdminDashboard } from "@/components/admin-dashboard";
import { MentorDashboard } from "@/components/mentor-dashboard";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        setUser(data.user);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleLogin(u: any) {
    setUser(u);
  }

  function handleLogout() {
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (user.role === "ADMIN") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === "MENTOR") {
    return <MentorDashboard user={user} onLogout={handleLogout} />;
  }

  return <StudentApp user={user} onLogout={handleLogout} />;
}
