import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/diagnostics
// Diagnoses why Firebase Auth users might not be appearing in the admin dashboard.
// Returns different info based on the caller's auth state so we can debug
// "Unauthorized" responses too.
//
// - Not logged in          → returns authState="not_logged_in"
// - Logged in as non-admin → returns authState + role (no sensitive data)
// - Logged in as admin     → returns full diagnostics
export async function GET() {
  const user = await getCurrentUser();

  // If not logged in at all, tell the caller (helps debug "Unauthorized")
  if (!user) {
    return NextResponse.json({
      authState: "not_logged_in",
      message: "You are not logged in. Please log in as the main admin at the login page first, then open this URL in the SAME browser tab.",
      hint: "The diagnostics endpoint reads your session cookie. Open it in the same browser window where you're logged in as admin.",
    });
  }

  // If logged in but not an admin, tell us what role they are (no sensitive data)
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") {
    return NextResponse.json({
      authState: "wrong_role",
      message: `You are logged in as a ${user.role}, not an admin. Please log out and log back in as the main admin.`,
      yourRole: user.role,
      yourName: user.name,
      hint: "Use the Admin tab on the login page with the main admin's username & password.",
    });
  }

  const isMainAdmin = user.role === "ADMIN";

  const result: any = {
    timestamp: new Date().toISOString(),
    authState: "ok",
    caller: {
      role: user.role,
      name: user.name,
      college: user.college?.name || null,
    },
    db: {},
    users: {},
    environment: {},
    issues: [],
  };

  // Sub-admins only get a limited view (their own college's students)
  if (!isMainAdmin) {
    result.message = "You are logged in as a sub-admin. Showing limited diagnostics for your college only. Log in as the main admin for full diagnostics.";
  }

  // 1. Test DB connectivity
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    result.db.connected = true;
    result.db.responseTimeMs = Date.now() - start;
  } catch (e: any) {
    result.db.connected = false;
    result.db.error = e?.message || String(e);
    result.issues.push("Database connection failed — DB queries will not work.");
    return NextResponse.json(result);
  }

  // 2. Count users by role (sub-admins only see their college's counts)
  try {
    const roleCounts = await db.user.groupBy({
      by: ["role"],
      _count: { _all: true },
      where: isMainAdmin ? undefined : { collegeId: user.collegeId },
    });
    result.users.byRole = roleCounts.map((r: any) => ({ role: r.role, count: r._count._all }));
    result.users.total = roleCounts.reduce((sum: number, r: any) => sum + r._count._all, 0);
  } catch (e: any) {
    result.users.byRole = "error";
    result.users.error = e?.message || String(e);
    result.issues.push("Could not count users by role.");
  }

  // 3. List all students (the ones that SHOULD appear in admin dashboard)
  // Sub-admins only see students in their college.
  try {
    const students = await db.user.findMany({
      where: {
        role: "STUDENT",
        ...(isMainAdmin ? {} : { collegeId: user.collegeId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        firebaseUid: true,
        authMethod: true,
        collegeId: true,
        departmentId: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    result.students = {
      count: students.length,
      list: students.map(s => ({
        ...s,
        firebaseUid: s.firebaseUid ? s.firebaseUid.substring(0, 8) + "..." : null,
        // Flag potential issues
        missingCollege: !s.collegeId,
        missingDepartment: !s.departmentId,
        missingFirebaseUid: !s.firebaseUid,
      })),
    };

    // Check for students with missing critical fields
    const missingCollege = students.filter(s => !s.collegeId);
    const missingDept = students.filter(s => !s.departmentId);
    if (missingCollege.length > 0) {
      result.issues.push(`${missingCollege.length} student(s) have no college assigned.`);
    }
    if (missingDept.length > 0) {
      result.issues.push(`${missingDept.length} student(s) have no department assigned.`);
    }
  } catch (e: any) {
    result.students = { error: e?.message || String(e) };
  }

  // 4. Recent signups (last 7 days) — to see if signups are working at all
  // Sub-admins only see their college's recent signups.
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await db.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        ...(isMainAdmin ? {} : { collegeId: user.collegeId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authMethod: true,
        firebaseUid: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    result.recentSignups = {
      count: recentUsers.length,
      list: recentUsers.map(u => ({
        ...u,
        firebaseUid: u.firebaseUid ? u.firebaseUid.substring(0, 8) + "..." : null,
      })),
    };
  } catch (e: any) {
    result.recentSignups = { error: e?.message || String(e) };
  }

  // 5. Check for orphaned Firebase users — users with firebaseUid but no college/department
  // (these users authenticated via Firebase but never completed the signup form)
  // Sub-admins only see orphans in their college.
  try {
    const orphaned = await db.user.findMany({
      where: {
        firebaseUid: { not: null },
        OR: [
          { collegeId: null },
          { departmentId: null },
        ],
        ...(isMainAdmin ? {} : { collegeId: user.collegeId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firebaseUid: true,
        collegeId: true,
        departmentId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    result.orphanedFirebaseUsers = {
      count: orphaned.length,
      list: orphaned.map(u => ({
        ...u,
        firebaseUid: u.firebaseUid ? u.firebaseUid.substring(0, 8) + "..." : null,
      })),
    };
    if (orphaned.length > 0) {
      result.issues.push(
        `${orphaned.length} user(s) authenticated via Firebase but have incomplete profiles (missing college/department). These users likely started Google sign-in but didn't complete the signup form.`
      );
    }
  } catch (e: any) {
    result.orphanedFirebaseUsers = { error: e?.message || String(e) };
  }

  // 6. Environment variable checks (presence only, never expose values)
  // Only main admin can see this — sub-admins shouldn't see server config.
  if (isMainAdmin) {
    result.environment = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID || !!process.env.NEXT_PUBLIC_FB_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasNextPublicFirebaseApiKey: !!process.env.NEXT_PUBLIC_FB_KEY || !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasNextPublicFirebaseAuthDomain: !!process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN || !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      nodeEnv: process.env.NODE_ENV,
    };

    if (!result.environment.hasDatabaseUrl) {
      result.issues.push("DATABASE_URL is not set — the app cannot connect to PostgreSQL. This is why no users appear in the admin dashboard!");
    }
    if (!result.environment.hasFirebaseClientEmail || !result.environment.hasFirebasePrivateKey) {
      result.issues.push("Firebase Admin SDK credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) are missing — ID token verification will fail, so signups can't create DB records.");
    }
  } else {
    result.environment = "hidden (sub-admin — log in as main admin to see env vars)";
  }

  // 7. Colleges and departments count (to verify reference data exists)
  try {
    const collegeCount = await db.college.count();
    const deptCount = await db.department.count();
    result.referenceData = { colleges: collegeCount, departments: deptCount };
    if (collegeCount === 0) {
      result.issues.push("No colleges exist in the DB — students can't sign up without selecting a college.");
    }
    if (deptCount === 0) {
      result.issues.push("No departments exist in the DB — students can't sign up without selecting a department.");
    }
  } catch (e: any) {
    result.referenceData = { error: e?.message || String(e) };
  }

  return NextResponse.json(result);
}
