import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/stats - overall platform stats with optional college filter
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");

  const where = collegeId ? { collegeId } : {};

  const [colleges, departments, mentors, students, questions, mockTests] = await Promise.all([
    db.college.count(),
    db.department.count({ where: collegeId ? { collegeId } : undefined }),
    db.user.count({ where: { role: "MENTOR", ...where } }),
    db.user.count({ where: { role: "STUDENT", ...where } }),
    db.question.count(),
    db.mockTest.count(),
  ]);

  // Activity: total logins, practice attempts, mock attempts
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

  // Per-college breakdown
  const collegesWithStats = await db.college.findMany({
    include: {
      _count: {
        select: {
          users: true,
          departments: true,
        },
      },
    },
  });

  const collegeStats = [];
  for (const c of collegesWithStats) {
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

  // Recent activity (last 50)
  const recentActivity = await db.activityLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
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

  // Mock test performance distribution
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
  });
}
