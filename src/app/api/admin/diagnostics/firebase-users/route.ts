import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/diagnostics/firebase-users
// Lists ALL DB users with their emails and roles, so you can compare against
// the Firebase Console → Authentication → Users list to find orphaned Firebase
// users (authenticated via Firebase but never created a DB record).
//
// Only main admin can access this.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result: any = {
    timestamp: new Date().toISOString(),
    summary: {},
    dbUsers: [],
    instructions: {},
  };

  try {
    // 1. All DB users with email (these are the ones that completed signup)
    const dbUsersWithEmail = await db.user.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authMethod: true,
        username: true,
        active: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. DB users WITHOUT email (LOCAL auth, using temp username/password)
    const dbUsersLocal = await db.user.findMany({
      where: { email: null },
      select: {
        id: true,
        name: true,
        role: true,
        authMethod: true,
        username: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    result.dbUsers = dbUsersWithEmail.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      authMethod: u.authMethod,
      active: u.active,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));

    result.dbLocalUsers = dbUsersLocal.map(u => ({
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
    }));

    // 3. Build a quick email lookup for comparison
    const dbEmails = new Set(
      dbUsersWithEmail
        .map(u => u.email?.toLowerCase())
        .filter(Boolean) as string[]
    );

    result.summary = {
      totalDbUsers: dbUsersWithEmail.length + dbUsersLocal.length,
      dbUsersWithEmail: dbUsersWithEmail.length,
      dbUsersWithLocalAuth: dbUsersLocal.length,
      dbEmails: Array.from(dbEmails).sort(),
    };

    result.instructions = {
      title: "How to find Firebase users NOT in the database",
      steps: [
        "1. Open Firebase Console → Authentication → Users tab",
        "2. For each user in Firebase, check if their email is in the 'dbEmails' list above",
        "3. Any Firebase email NOT in the dbEmails list = ORPHANED user",
        "4. Orphaned users started Google/email sign-in but never completed the signup form (college, department, roll number)",
        "5. To fix: tell the user to log in again and complete the signup form, OR delete them from Firebase Authentication",
      ],
      importantNote: "If a user's email IS in the dbEmails list, they have a DB record and will appear in the admin dashboard under their role's tab (Students/Mentors/Sub-Admins/Admin).",
    };
  } catch (e: any) {
    result.error = e?.message || String(e);
  }

  return NextResponse.json(result);
}
