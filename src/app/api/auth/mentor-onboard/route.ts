import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyIdToken } from "@/lib/firebase-admin";
import { logActivity } from "@/lib/gamify";

// POST /api/auth/mentor-onboard
// Body: { idToken }
//
// Completes a mentor's first-time setup. The mentor is logged in via a temp
// username/password session (authMethod=LOCAL). This endpoint:
//   1. Verifies the current session user is a MENTOR with authMethod=LOCAL
//      (i.e. they used their admin-issued temp credentials and haven't onboarded yet).
//   2. Verifies the Firebase ID token they just created by signing up with
//      their own email & password on the client.
//   3. Upgrades the DB record: sets email, firebaseUid, authMethod=FIREBASE,
//      and clears the temp `password` so the temp credentials stop working.
//
// After this, the mentor logs in normally via /api/auth/firebase-login using
// their email & password.
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json(
        { error: "Missing Firebase ID token. Please try again." },
        { status: 400 }
      );
    }

    // 1. Must be logged in via the temp session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again with your username & password." },
        { status: 401 }
      );
    }
    // Both MENTOR and SUB_ADMIN go through this onboarding flow. The main admin
    // creates them with temp username/password (authMethod=LOCAL); they use
    // those temp creds once to reach this screen and set up their own email +
    // password, which upgrades authMethod to FIREBASE and clears the temp password.
    if (currentUser.role !== "MENTOR" && currentUser.role !== "SUB_ADMIN") {
      return NextResponse.json(
        { error: "Only mentor or sub-admin accounts can complete this setup." },
        { status: 403 }
      );
    }
    if (currentUser.authMethod === "FIREBASE") {
      return NextResponse.json(
        { error: "Your account is already set up. Please log in with your email & password." },
        { status: 400 }
      );
    }

    // 2. Verify the Firebase ID token the client just created
    const fbUser = await verifyIdToken(idToken);
    if (!fbUser) {
      return NextResponse.json(
        { error: "We couldn't verify your new account. Please try again." },
        { status: 401 }
      );
    }
    if (!fbUser.email) {
      return NextResponse.json(
        { error: "Your Firebase account has no email. Please try again." },
        { status: 400 }
      );
    }

    // 3. Make sure this Firebase account isn't already linked to a different user
    const conflictByUid = await db.user.findUnique({
      where: { firebaseUid: fbUser.localId },
    });
    if (conflictByUid && conflictByUid.id !== currentUser.id) {
      return NextResponse.json(
        { error: "This Firebase account is already linked to another user. Please use a different email." },
        { status: 409 }
      );
    }
    const conflictByEmail = await db.user.findUnique({
      where: { email: fbUser.email.toLowerCase() },
    });
    if (conflictByEmail && conflictByEmail.id !== currentUser.id) {
      return NextResponse.json(
        { error: "Another account already uses this email. Please use a different email." },
        { status: 409 }
      );
    }

    // 4. Upgrade the mentor's record
    const updated = await db.user.update({
      where: { id: currentUser.id },
      data: {
        email: fbUser.email.toLowerCase(),
        firebaseUid: fbUser.localId,
        authMethod: "FIREBASE",
        // Clear the temp password so the admin-issued username/password can
        // no longer be used to log in. Username is kept for display/reference.
        password: null,
      },
      include: { college: true, department: true, mentor: true },
    });

    await logActivity(
      updated.id,
      "mentor_onboard",
      `email=${updated.email};college=${updated.college?.code || "?"}`
    );

    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch (e) {
    console.error("Mentor onboarding error:", e);
    return NextResponse.json(
      { error: "Setup failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
