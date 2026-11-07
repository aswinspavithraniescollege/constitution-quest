import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/mentor/results?studentId=
// Returns detailed results for mentor's students
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");

  // If studentId is provided, return that student's detailed results
  if (studentId) {
    const student = await db.user.findUnique({
      where: { id: studentId },
      include: { college: true, department: true },
    });
    if (!student || student.role !== "STUDENT" || student.mentorId !== user.id) {
      return NextResponse.json({ error: "Student not found in your mentorship" }, { status: 404 });
    }

    const practiceAttempts = await db.practiceAttempt.findMany({
      where: { userId: studentId },
      include: { question: { select: { weekId: true, week: { select: { number: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const mockAttempts = await db.mockTestAttempt.findMany({
      where: { userId: studentId },
      include: { mockTest: { select: { title: true, week: { select: { number: true } } } } },
      orderBy: { completedAt: "desc" },
    });

    const badges = await db.studentBadge.findMany({
      where: { userId: studentId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });

    const weekStats = new Map<string, { weekNumber: number; weekTitle: string; attempted: number; correct: number }>();
    for (const p of practiceAttempts) {
      if (!p.question?.week) continue;
      const key = p.question.weekId;
      if (!weekStats.has(key)) {
        weekStats.set(key, { weekNumber: p.question.week.number, weekTitle: p.question.week.title, attempted: 0, correct: 0 });
      }
      const ws = weekStats.get(key)!;
      ws.attempted++;
      if (p.isCorrect) ws.correct++;
    }

    return NextResponse.json({
      student: {
        id: student.id, name: student.name, email: student.email, rollNumber: student.rollNumber,
        xp: student.xp, level: student.level, streak: student.streak,
        college: student.college?.name, department: student.department?.name,
      },
      weekStats: Array.from(weekStats.values()).sort((a, b) => a.weekNumber - b.weekNumber),
      mockAttempts: mockAttempts.map(m => ({
        id: m.id, title: m.mockTest.title, weekNumber: m.mockTest.week?.number || null,
        score: m.score, total: m.totalQuestions,
        percent: m.totalQuestions > 0 ? Math.round((m.score / m.totalQuestions) * 100) : 0,
        completedAt: m.completedAt,
      })),
      badges: badges.map(b => ({ name: b.badge.name, icon: b.badge.icon, earnedAt: b.earnedAt })),
      totalPractice: practiceAttempts.length,
      totalCorrect: practiceAttempts.filter(p => p.isCorrect).length,
      accuracy: practiceAttempts.length > 0 ? Math.round((practiceAttempts.filter(p => p.isCorrect).length / practiceAttempts.length) * 100) : 0,
    });
  }

  // Return all students under this mentor with summary
  const students = await db.user.findMany({
    where: { mentorId: user.id, role: "STUDENT" },
    include: {
      department: { select: { name: true, code: true } },
      _count: { select: { practiceAttempts: true, mockAttempts: true, studentBadges: true } },
    },
    orderBy: { xp: "desc" },
  });

  const studentIds = students.map(s => s.id);
  const correctCounts = await db.practiceAttempt.groupBy({
    by: ["userId"], where: { userId: { in: studentIds }, isCorrect: true }, _count: true,
  });
  const correctMap = new Map(correctCounts.map(c => [c.userId, c._count]));
  const mockBest = await db.mockTestAttempt.groupBy({
    by: ["userId"], where: { userId: { in: studentIds } }, _max: { score: true }, _count: true,
  });
  const mockMap = new Map(mockBest.map(m => [m.userId, { bestScore: m._max.score || 0, count: m._count }]));

  return NextResponse.json({
    students: students.map(s => ({
      id: s.id, name: s.name, email: s.email, rollNumber: s.rollNumber,
      xp: s.xp, level: s.level, streak: s.streak,
      department: s.department,
      practiceCount: s._count.practiceAttempts,
      correctCount: correctMap.get(s.id) || 0,
      accuracy: s._count.practiceAttempts > 0 ? Math.round(((correctMap.get(s.id) || 0) / s._count.practiceAttempts) * 100) : 0,
      mockCount: mockMap.get(s.id)?.count || 0,
      mockBestScore: mockMap.get(s.id)?.bestScore || 0,
      badgeCount: s._count.studentBadges,
      lastLoginAt: s.lastLoginAt,
    })),
  });
}
