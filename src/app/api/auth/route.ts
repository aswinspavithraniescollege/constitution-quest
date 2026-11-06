import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword, getCurrentUser } from "@/lib/auth";
import { logActivity, updateStreak, awardXp, XP_REWARDS } from "@/lib/gamify";

// POST /api/auth — local (username/password) login
// Used by: Admin portal, Sub-Admin portal, and fallback login for students/mentors
// who were issued username/password credentials by an admin.
//
// Body: { username, password, role? }
// If role is provided, we verify the user has that role (extra security for role-based logins).
export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username: username.trim() },
      include: { college: true, department: true },
    });

    // Always run bcrypt compare to prevent timing attacks (even if user not found)
    const dummyHash = "$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3a8e5L4pQYqB5e3a8e5L4pQYqB5e";
    const passwordOk = user?.password
      ? await verifyPassword(password, user.password)
      : await verifyPassword(password, dummyHash);

    if (!user || !passwordOk) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    // If a role was specified (from role-based login), verify the user has that role
    // For the ADMIN portal, both ADMIN and SUB_ADMIN roles are accepted
    if (role) {
      const roleMatches = user.role === role ||
        (role === "ADMIN" && (user.role === "ADMIN" || user.role === "SUB_ADMIN"));
      if (!roleMatches) {
        return NextResponse.json(
          {
            error: `This account is not a ${role.toLowerCase()} account. Please use the correct login portal.`,
          },
          { status: 403 }
        );
      }
    }

    // Mentor onboarding guard:
    // Mentors created by an admin start as authMethod=LOCAL with temp username/password,
    // used only to reach the onboarding screen where they set up their own email & password.
    // Once a mentor has onboarded (authMethod=FIREBASE), username/password login is disabled
    // and they must use the Email tab (Firebase email/password) instead.
    if (user.role === "MENTOR" && user.authMethod === "FIREBASE") {
      return NextResponse.json(
        {
          error: "Your account is already set up. Please use the Email tab to log in with your email & password.",
        },
        { status: 403 }
      );
    }

    await createSession(user.id);
    await logActivity(user.id, "login", "method=local");
    if (user.role === "STUDENT") {
      await updateStreak(user.id);
      await awardXp(user.id, XP_REWARDS.DAILY_LOGIN);
    }

    // Sync to Firestore (leaderboard + activity) — non-blocking, for all roles
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      include: { college: true, department: true },
    });
    if (updatedUser) {
      const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
      // Update leaderboard (for students only — they're the ones with XP)
      if (updatedUser.role === "STUDENT") {
        fetch(`${FIRESTORE_URL}/leaderboard/${updatedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: {
            userId: { stringValue: updatedUser.id },
            name: { stringValue: updatedUser.name },
            username: { stringValue: updatedUser.username || "" },
            xp: { integerValue: String(updatedUser.xp) },
            level: { integerValue: String(updatedUser.level) },
            streak: { integerValue: String(updatedUser.streak) },
            collegeCode: { stringValue: updatedUser.college?.code || "" },
            deptCode: { stringValue: updatedUser.department?.code || "" },
            collegeName: { stringValue: updatedUser.college?.name || "" },
            updatedAt: { timestampValue: new Date().toISOString() },
          }}),
        }).catch(() => {});
      }
      // Add to activity feed (all roles)
      fetch(`${FIRESTORE_URL}/activityFeed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          userId: { stringValue: updatedUser.id },
          userName: { stringValue: updatedUser.name },
          userRole: { stringValue: updatedUser.role },
          action: { stringValue: "login" },
          details: { stringValue: "method=local" },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          collegeName: { stringValue: updatedUser.college?.name || "" },
          timestamp: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Login failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const user = await getCurrentUser();
  if (user) {
    await logActivity(user.id, "logout");
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}

// GET /api/auth — get current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const { password, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
