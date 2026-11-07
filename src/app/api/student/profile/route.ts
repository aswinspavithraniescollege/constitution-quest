import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// GET /api/student/profile — get current student/guest profile
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STUDENT" && user.role !== "GUEST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { password, ...safe } = user;
  // Tell the client whether the user already has a password set.
  // Google-only users (authMethod=FIREBASE, password=null) don't have a
  // password yet — they need a "Set Password" UI instead of "Change Password".
  return NextResponse.json({
    profile: { ...safe, hasPassword: !!user.password },
  });
}

// PATCH /api/student/profile — update own profile
// Students & guests can edit: name, phone, rollNumber, password
// Password rules:
//   - Has password already (LOCAL or previously set): must verify currentPassword
//   - Google-only user (no password yet): can set a password without currentPassword
//     (this lets them log in with email/password in addition to Google)
// They CANNOT edit: username, email (Firebase-managed), college, department, mentor, role, xp, level, etc.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STUDENT" && user.role !== "GUEST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { name, phone, rollNumber, newPassword, currentPassword } = await req.json();
    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      data.name = name.trim();
    }
    if (phone !== undefined) data.phone = phone || null;
    if (rollNumber !== undefined) data.rollNumber = rollNumber || null;

    // Password change/set
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      if (user.password) {
        // User already has a password — verify the current one before changing
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
        }
        const { verifyPassword } = await import("@/lib/auth");
        const ok = await verifyPassword(currentPassword, user.password);
        if (!ok) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        data.password = await hashPassword(newPassword);
      } else {
        // User doesn't have a password yet (Google-only user).
        // Let them SET a password without requiring currentPassword.
        // The client should also call Firebase updatePassword() to add the
        // password provider to their Firebase account, so email/password
        // login works too.
        data.password = await hashPassword(newPassword);
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      include: { college: true, department: true, mentor: true },
    });
    await logActivity(user.id, "profile_update", `fields=${Object.keys(data).join(",")}`);
    const { password: _, ...safe } = updated;
    return NextResponse.json({ profile: { ...safe, hasPassword: !!updated.password } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
