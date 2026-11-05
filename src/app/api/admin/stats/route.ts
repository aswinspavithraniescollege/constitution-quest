import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/stats
// - Main admin: can pass collegeId to filter, otherwise sees everything
// - Sub-admin: forced to their college
export async function GET(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  // Sub-admins always scoped to their college
  const collegeId = user.role === "SUB_ADMIN" ? user.collegeId! : (url.searchParams.get("collegeId") || "");

  const where = collegeId ? { collegeId } : {};

  const [colleges, departments, mentors, students, questions, mockTests] = await Promise.all([
    db.college.count(),
    db.department.count({ where: collegeId ? { collegeId } : undefined }),
    db.user.count({ where: { role: "MENTOR", ...where } }),
    db.user.count({ where: { role: "STUDENT", ...where } }),
    db.question.count(),
    db.mockTest.count(),
  ]);

  const [totalLogins, totalPractice, totalMock] = await Promise.all([
    db.activityLog.count({
      where: {
        action: "login",
        user: collegeId ? { collegeId } : undefined,
      },
    }),
    db.practiceAttempt.count({
      where: collegeId ? { user: { collegeId } } : undefined,
    }),
    db.mockTestAttempt.count({
      where: collegeId ? { user: { collegeId } } : undefined,
    }),
  ]);

  // Top 10 students by XP
  const topStudents = await db.user.findMany({
    where: { role: "STUDENT", ...where },
    orderBy: { xp: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      username: true,
      xp: true,
      level: true,
      streak: true,
      college: { select: { name: true, code: true } },
      department: { select: { name: true, code: true } },
    },
  });

  // Per-college breakdown — only main admin sees all colleges
  let collegeStats: any[] = [];
  if (user.role === "ADMIN") {
    const collegesWithCounts = await db.college.findMany({
      include: { _count: { select: { users: true, departments: true } } },
    });
    for (const c of collegesWithCounts) {
      const [s, m, pa, ma] = await Promise.all([
        db.user.count({ where: { collegeId: c.id, role: "STUDENT" } }),
        db.user.count({ where: { collegeId: c.id, role: "MENTOR" } }),
        db.practiceAttempt.count({ where: { user: { collegeId: c.id } } }),
        db.mockTestAttempt.count({ where: { user: { collegeId: c.id } } }),
      ]);
      collegeStats.push({
        id: c.id,
        name: c.name,
        code: c.code,
        location: c.location,
        students: s,
        mentors: m,
        departments: c._count.departments,
        practiceAttempts: pa,
        mockAttempts: ma,
      });
    }
  } else if (user.role === "SUB_ADMIN" && user.collegeId) {
    // Sub-admin sees only their college summary
    const c = await db.college.findUnique({ where: { id: user.collegeId } });
    if (c) {
      const [s, m, pa, ma, d] = await Promise.all([
        db.user.count({ where: { collegeId: c.id, role: "STUDENT" } }),
        db.user.count({ where: { collegeId: c.id, role: "MENTOR" } }),
        db.practiceAttempt.count({ where: { user: { collegeId: c.id } } }),
        db.mockTestAttempt.count({ where: { user: { collegeId: c.id } } }),
        db.department.count({ where: { collegeId: c.id } }),
      ]);
      collegeStats.push({
        id: c.id,
        name: c.name,
        code: c.code,
        location: c.location,
        students: s,
        mentors: m,
        departments: d,
        practiceAttempts: pa,
        mockAttempts: ma,
      });
    }
  }

  // Recent activity (last 50) — scoped
  const recentActivity = await db.activityLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    where: collegeId ? { user: { collegeId } } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          college: { select: { name: true, code: true } },
        },
      },
    },
  });

  // Mock test performance (last 100)
  const mockAttempts = await db.mockTestAttempt.findMany({
    where: collegeId ? { user: { collegeId } } : undefined,
    include: {
      mockTest: { select: { title: true } },
      user: { select: { name: true, username: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    counts: {
      colleges,
      departments,
      mentors,
      students,
      questions,
      mockTests,
      totalLogins,
      totalPractice,
      totalMock,
    },
    topStudents,
    collegeStats,
    recentActivity,
    mockAttempts,
    // Tell the client what scope they have
    scope: user.role === "SUB_ADMIN" ? { collegeId: user.collegeId, isSubAdmin: true } : { isMainAdmin: true },
  });
}
