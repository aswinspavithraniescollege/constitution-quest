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
      return NextResponse.json(
        {
          error:
            "No account found for this email. Please sign up first, or contact your college admin if you believe this is an error.",
        },
        { status: 404 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    // If a role was specified, verify the user has that role
    if (role && user.role !== role) {
      return NextResponse.json(
        {
          error: `This account is a ${user.role.toLowerCase()}, not a ${role.toLowerCase()}. Please use the correct portal.`,
        },
        { status: 403 }
      );
    }

    await createSession(user.id);
    await logActivity(user.id, "login", "method=firebase");
    if (user.role === "STUDENT") {
      await updateStreak(user.id);
      await awardXp(user.id, XP_REWARDS.DAILY_LOGIN);
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
