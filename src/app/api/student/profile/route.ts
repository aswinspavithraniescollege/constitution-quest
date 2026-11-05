import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// GET /api/student/profile — get current student's profile
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { password, ...safe } = user;
  return NextResponse.json({ profile: safe });
}

// PATCH /api/student/profile — update own profile
// Students can edit: name, phone, rollNumber, password (with currentPassword verification)
// Students CANNOT edit: username, email (Firebase-managed), college, department, mentor, role, xp, level, etc.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
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

    // Password change requires current password verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
      // Password change — works for ALL users (LOCAL and email-signup)
      if (user.authMethod === "LOCAL" && user.password) {
        // LOCAL users: verify current password
        const { verifyPassword } = await import("@/lib/auth");
        const ok = await verifyPassword(currentPassword, user.password);
        if (!ok) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        data.password = await hashPassword(newPassword);
      } else {
        // Email-signup users: set password in DB (they can now use it for login too)
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required" }, { status: 400 });
        }
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
    return NextResponse.json({ profile: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
