import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/student/leaderboard?scope=college|global|department&collegeId=&departmentId=
// - scope=global: all students across ALL colleges (admin/mentor view)
// - scope=college: students in a specific college (collegeId param, or the caller's college)
// - scope=department: students in a specific department (departmentId param)
//
// Admins/mentors can pass collegeId/departmentId to view any college/dept.
// Students are scoped to their own college/dept (privacy).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "college";
  const collegeIdParam = url.searchParams.get("collegeId");
  const departmentIdParam = url.searchParams.get("departmentId");

  // Determine the effective college/department based on the caller's role.
  // Admins/sub-admins can view any college; students are limited to their own.
  const isAdmin = user.role === "ADMIN" || user.role === "SUB_ADMIN" || user.role === "MENTOR";
  let effectiveCollegeId: string | null = null;
  let effectiveDepartmentId: string | null = null;

  if (scope === "global") {
    // Global = all colleges. Only admins/mentors should use this; students
    // are blocked from global scope (privacy — they only see their own college).
    if (!isAdmin) {
      // Students requesting "global" get scoped to their own college instead.
      effectiveCollegeId = user.collegeId;
    }
    // else: no college filter = all colleges
  } else if (scope === "college") {
    // College scope: use the param if admin, else the caller's college.
    if (isAdmin && collegeIdParam) {
      effectiveCollegeId = collegeIdParam;
    } else {
      effectiveCollegeId = user.collegeId;
    }
  } else if (scope === "department") {
    // Department scope: use the param if admin, else the caller's department.
    if (isAdmin && departmentIdParam) {
      effectiveDepartmentId = departmentIdParam;
    } else {
      effectiveDepartmentId = user.departmentId;
    }
  }

  const where: any = { role: "STUDENT", active: true };
  if (effectiveCollegeId) where.collegeId = effectiveCollegeId;
  if (effectiveDepartmentId) where.departmentId = effectiveDepartmentId;

  const top = await db.user.findMany({
    where,
    orderBy: [{ xp: "desc" }, { level: "desc" }],
    take: 100,
    select: {
      id: true,
      name: true,
      username: true,
      xp: true,
      level: true,
      streak: true,
      longestStreak: true,
      college: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
      _count: {
        select: { practiceAttempts: true, mockAttempts: true, studentBadges: true },
      },
    },
  });

  const ranked = top.map((u, i) => ({
    rank: i + 1,
    ...u,
    isCurrentUser: u.id === user.id,
  }));

  return NextResponse.json({ leaderboard: ranked, myRank: ranked.find(r => r.isCurrentUser)?.rank || null });
}
