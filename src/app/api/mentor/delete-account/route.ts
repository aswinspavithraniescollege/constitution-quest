import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// POST /api/mentor/delete-account
// Mentors can delete their own account
// Cannot delete if they have students assigned
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { currentPassword } = await req.json();

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

    // Clean up Firestore data
    const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
    fetch(`${FIRESTORE_URL}/leaderboard/${user.id}`, { method: "DELETE" }).catch(() => {});

    // Log the deletion
    await logActivity(user.id, "account_deleted", "Mentor self-deleted account");

    // Delete activity logs
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
