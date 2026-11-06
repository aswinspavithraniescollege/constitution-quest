import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// POST /api/mentor/delete-account
// Mentors can delete their own account
// Cannot delete if they have students assigned
// This deletes: DB records, Firestore data, AND the Firebase account
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { currentPassword, idToken } = await req.json();

    // For LOCAL users, verify password
    if (user.authMethod === "LOCAL" && user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Password is required to delete your account" }, { status: 400 });
      }
      const ok = await verifyPassword(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
      }
    }

    // Check if mentor has students assigned
    const studentCount = await db.user.count({ where: { mentorId: user.id } });
    if (studentCount > 0) {
      return NextResponse.json({
        error: `Cannot delete account: you have ${studentCount} student(s) assigned to you. Please ask the admin to reassign your students before deleting your account.`,
      }, { status: 400 });
    }

    // Delete Firebase account using REST API
    if (user.firebaseUid && idToken) {
      try {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${process.env.NEXT_PUBLIC_FB_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );
      } catch (e) {
        console.error("Failed to delete Firebase account:", e);
      }
    }

    // Clean up Firestore data
    const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
    fetch(`${FIRESTORE_URL}/leaderboard/${user.id}`, { method: "DELETE" }).catch(() => {});

    // Log the deletion
    await logActivity(user.id, "account_deleted", "Mentor self-deleted account");

    // Delete activity logs
    await db.activityLog.deleteMany({ where: { userId: user.id } });

    // Delete the user from DB
    await db.user.delete({ where: { id: user.id } });

    // Destroy session
    const { destroySession } = await import("@/lib/auth");
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete account error:", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
