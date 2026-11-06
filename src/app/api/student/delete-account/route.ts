import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// POST /api/student/delete-account
// Students can delete their own account
// Requires: { currentPassword } for LOCAL users (verification)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { currentPassword } = await req.json();

    // For LOCAL users, verify password
    if (user.authMethod === "LOCAL" && user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Password is required to delete your account" }, { status: 400 });
      }
      const { verifyPassword } = await import("@/lib/auth");
      const ok = await verifyPassword(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
      }
    }

    // Clean up Firestore data
    const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
    // Delete leaderboard entry
    fetch(`${FIRESTORE_URL}/leaderboard/${user.id}`, { method: "DELETE" }).catch(() => {});

    // Log the deletion (before deleting the user)
    await logActivity(user.id, "account_deleted", "Student self-deleted account");

    // Delete all related data
    await db.practiceAttempt.deleteMany({ where: { userId: user.id } });
    await db.mockTestAttempt.deleteMany({ where: { userId: user.id } });
    await db.studentBadge.deleteMany({ where: { userId: user.id } });
    await db.activityLog.deleteMany({ where: { userId: user.id } });

    // Delete the user
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
