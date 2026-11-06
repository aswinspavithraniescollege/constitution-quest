import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyIdToken } from "@/lib/firebase-admin";
import { logActivity, updateStreak, awardXp, XP_REWARDS } from "@/lib/gamify";

// POST /api/auth/firebase-login
// Body: { idToken, role }
//
// Verifies the Firebase ID token, looks up the user in our DB by firebaseUid (or by email as fallback),
// creates a session, and returns the user data.
export async function POST(req: NextRequest) {
  try {
    const { idToken, role } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
    }

    const fbUser = await verifyIdToken(idToken);
    if (!fbUser) {
      return NextResponse.json(
        { error: "Invalid or expired Firebase session. Please sign in again." },
        { status: 401 }
      );
    }

    // Look up user by firebaseUid
    let user = await db.user.findUnique({
      where: { firebaseUid: fbUser.localId },
      include: { college: true, department: true, mentor: true },
    });

    // Fallback: try to find by email (for legacy or admin-imported users with Firebase accounts)
    if (!user && fbUser.email) {
      user = await db.user.findUnique({
        where: { email: fbUser.email.toLowerCase() },
        include: { college: true, department: true, mentor: true },
      });
      if (user) {
        // Link the firebaseUid for future logins
        user = await db.user.update({
          where: { id: user.id },
          data: {
            firebaseUid: fbUser.localId,
            authMethod: "FIREBASE",
            email: fbUser.email.toLowerCase(),
          },
          include: { college: true, department: true, mentor: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json({
        error: "No account found for this email. Your email is registered but your profile is incomplete. Please sign up to complete your registration, or contact your admin.",
      }, { status: 404 });
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    // If a role was specified, verify the user has that role
    // For the ADMIN portal, both ADMIN and SUB_ADMIN roles are accepted
    if (role) {
      const roleMatches = user.role === role ||
        (role === "ADMIN" && (user.role === "ADMIN" || user.role === "SUB_ADMIN"));
      if (!roleMatches) {
        return NextResponse.json(
          {
            error: `This account is a ${user.role.toLowerCase()}, not a ${role.toLowerCase()}. Please use the correct portal.`,
          },
          { status: 403 }
        );
      }
    }

    await createSession(user.id);
    await logActivity(user.id, "login", "method=firebase");
    if (user.role === "STUDENT") {
      await updateStreak(user.id);
      await awardXp(user.id, XP_REWARDS.DAILY_LOGIN);
    }

    // Sync to Firestore (leaderboard + activity) — non-blocking
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      include: { college: true, department: true },
    });
    if (updatedUser) {
      const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
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
      fetch(`${FIRESTORE_URL}/activityFeed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          userId: { stringValue: updatedUser.id },
          userName: { stringValue: updatedUser.name },
          userRole: { stringValue: updatedUser.role },
          action: { stringValue: "login" },
          details: { stringValue: "method=firebase" },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          collegeName: { stringValue: updatedUser.college?.name || "" },
          timestamp: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (e) {
    console.error("Firebase login error:", e);
    return NextResponse.json(
      { error: "Login failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
