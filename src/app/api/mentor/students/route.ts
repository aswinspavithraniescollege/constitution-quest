import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/mentor/students - list mentor's students with stats
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const students = await db.user.findMany({
    where: { mentorId: user.id, role: "STUDENT" },
    include: {
      department: true,
      _count: {
        select: {
          practiceAttempts: true,
          mockAttempts: true,
          activityLogs: true,
          studentBadges: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // For each student, also compute week-wise progress
  const enriched = await Promise.all(students.map(async s => {
    const practiceAttempts = await db.practiceAttempt.findMany({
      where: { userId: s.id },
      include: { question: { select: { weekId: true } } },
    });
    const mockAttempts = await db.mockTestAttempt.findMany({
      where: { userId: s.id },
      include: { mockTest: { select: { title: true } } },
    });
    const weekStats = new Map<string, { attempted: number; correct: number }>();
    for (const p of practiceAttempts) {
      if (!p.question) continue;
      const w = p.question.weekId;
      if (!weekStats.has(w)) weekStats.set(w, { attempted: 0, correct: 0 });
      const ws = weekStats.get(w)!;
      ws.attempted++;
      if (p.isCorrect) ws.correct++;
    }
    const recentActivity = await db.activityLog.findMany({
      where: { userId: s.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const { password, ...safe } = s;
    return {
      ...safe,
      weekStats: Array.from(weekStats.entries()).map(([weekId, stats]) => ({ weekId, ...stats })),
      mockAttempts: mockAttempts.map(m => ({
        id: m.id,
        title: m.mockTest.title,
        score: m.score,
        total: m.totalQuestions,
        completedAt: m.completedAt,
      })),
      recentActivity: recentActivity.map(a => ({
        action: a.action,
        details: a.details,
        timestamp: a.createdAt,
      })),
      lastLoginAt: s.lastLoginAt,
    };
  }));

  return NextResponse.json({ students: enriched });
}
