import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, updateStreak } from "@/lib/gamify";

// GET /api/student/dashboard
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // Refresh streak
  await updateStreak(user.id);
  await logActivity(user.id, "page_view", "dashboard");

  // Get weeks with user progress
  const weeks = await db.week.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { questions: true, mockTests: true } },
      topics: { orderBy: { part: "asc" } },
    },
  });

  // Practice stats per week
  const practiceAttempts = await db.practiceAttempt.findMany({
    where: { userId: user.id },
    include: { question: { select: { weekId: true, id: true } } },
  });
  const weekProgress = new Map<string, { attempted: number; correct: number; total: number }>();
  for (const w of weeks) {
    weekProgress.set(w.id, { attempted: 0, correct: 0, total: w._count.questions });
  }
  for (const p of practiceAttempts) {
    if (!p.question) continue;
    const wp = weekProgress.get(p.question.weekId);
    if (wp) {
      wp.attempted++;
      if (p.isCorrect) wp.correct++;
    }
  }

  // Mock attempts
  const mockAttempts = await db.mockTestAttempt.findMany({
    where: { userId: user.id },
    include: { mockTest: { select: { title: true, week: { select: { number: true } } } } },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  // Badges
  const badges = await db.studentBadge.findMany({
    where: { userId: user.id },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });

  // Recent activity (last 20)
  const recentActivity = await db.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Total practice count and correct count
  const totalPractice = practiceAttempts.length;
  const totalCorrect = practiceAttempts.filter(p => p.isCorrect).length;

  // Recent 10 attempts for review
  const recentAttempts = await db.practiceAttempt.findMany({
    where: { userId: user.id },
    include: { question: { select: { questionText: true, correctOption: true, optionA: true, optionB: true, optionC: true, optionD: true, explanation: true, whyWrongA: true, whyWrongB: true, whyWrongC: true, whyWrongD: true, week: { select: { number: true, title: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      longestStreak: user.longestStreak,
      college: user.college,
      department: user.department,
      mentor: user.mentor?.name || null,
    },
    weeks: weeks.map(w => ({
      id: w.id,
      number: w.number,
      title: w.title,
      description: w.description,
      totalQuestions: w._count.questions,
      mockTestCount: w._count.mockTests,
      topics: w.topics,
      progress: weekProgress.get(w.id),
    })),
    mockAttempts: mockAttempts.map(m => ({
      id: m.id,
      title: m.mockTest.title,
      weekNumber: m.mockTest.week?.number || null,
      score: m.score,
      total: m.totalQuestions,
      percent: m.totalQuestions > 0 ? Math.round((m.score / m.totalQuestions) * 100) : 0,
      completedAt: m.completedAt,
    })),
    badges: badges.map(b => ({
      id: b.badge.id,
      name: b.badge.name,
      description: b.badge.description,
      icon: b.badge.icon,
      earnedAt: b.earnedAt,
    })),
    recentActivity: recentActivity.map(a => ({
      action: a.action,
      details: a.details,
      timestamp: a.createdAt,
    })),
    recentAttempts: recentAttempts.map(a => ({
      id: a.id,
      isCorrect: a.isCorrect,
      selectedOption: a.selectedOption,
      question: a.question,
      timestamp: a.createdAt,
    })),
    stats: {
      totalPractice,
      totalCorrect,
      accuracy: totalPractice > 0 ? Math.round((totalCorrect / totalPractice) * 100) : 0,
      mockCount: mockAttempts.length,
      badgeCount: badges.length,
    },
  });
}
