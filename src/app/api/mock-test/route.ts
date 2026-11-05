import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// This endpoint allows ANY authenticated user (admin, sub-admin, mentor, student) to:
// - GET mock test questions (to preview/take the test)
// - POST submit answers and get a score (without XP/badges for non-students)
//
// For students: works the same as /api/student/submit-mock (with XP, badges, Firestore sync)
// For admin/mentor: returns score + detailed review only (no XP, no stats tracking)

// GET /api/mock-test?mockTestId=... — get mock test questions (no answers shown)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("mockTestId");
  if (!id) return NextResponse.json({ error: "mockTestId required" }, { status: 400 });

  const mt = await db.mockTest.findUnique({ where: { id }, include: { week: true } });
  if (!mt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ids = JSON.parse(mt.questionIds) as string[];
  const questions = await db.question.findMany({
    where: { id: { in: ids } },
    include: { topic: true },
  });
  // Sort by original order
  const sorted = ids.map(id => questions.find(q => q.id === id)).filter(Boolean);
  const safe = sorted.map(q => ({
    id: q!.id,
    questionText: q!.questionText,
    optionA: q!.optionA,
    optionB: q!.optionB,
    optionC: q!.optionC,
    optionD: q!.optionD,
    difficulty: q!.difficulty,
    topic: q!.topic?.name,
  }));

  await logActivity(user.id, "mock_test_preview", `mockTestId=${id};role=${user.role}`);

  return NextResponse.json({
    mockTest: {
      id: mt.id,
      title: mt.title,
      description: mt.description,
      durationMin: mt.durationMin,
      weekNumber: mt.week?.number || null,
      numQuestions: ids.length,
    },
    questions: safe,
    isTestMode: user.role !== "STUDENT", // Admin/mentor = test mode (no XP)
  });
}

// POST /api/mock-test — submit answers and get score
// Body: { mockTestId, answers: { questionId: option }, timeTakenSec }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mockTestId, answers, timeTakenSec } = await req.json();
    if (!mockTestId || !answers) {
      return NextResponse.json({ error: "mockTestId and answers required" }, { status: 400 });
    }

    const mt = await db.mockTest.findUnique({ where: { id: mockTestId }, include: { week: true } });
    if (!mt) return NextResponse.json({ error: "Mock test not found" }, { status: 404 });

    const ids = JSON.parse(mt.questionIds) as string[];
    const questions = await db.question.findMany({ where: { id: { in: ids } } });

    let score = 0;
    const detail: any[] = [];
    for (const q of questions) {
      const sel = answers[q.id];
      const correct = sel === q.correctOption;
      if (correct) score++;
      detail.push({
        questionId: q.id,
        questionText: q.questionText,
        optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
        correctOption: q.correctOption,
        selectedOption: sel || null,
        isCorrect: correct,
        explanation: q.explanation,
        whyWrongA: q.whyWrongA,
        whyWrongB: q.whyWrongB,
        whyWrongC: q.whyWrongC,
        whyWrongD: q.whyWrongD,
      });
    }

    const total = questions.length;
    const isStudent = user.role === "STUDENT";

    // Only students get XP, badges, and attempt records
    let xpAwarded = 0;
    let newBadges: any[] = [];
    let userStats: any = null;

    if (isStudent) {
      // Create attempt record
      const attempt = await db.mockTestAttempt.create({
        data: {
          userId: user.id,
          mockTestId,
          answers: JSON.stringify(answers),
          score,
          totalQuestions: total,
          timeTakenSec: timeTakenSec || 0,
          completedAt: new Date(),
        },
      });

      // Award XP
      const { awardXp, checkAndAwardBadges, XP_REWARDS } = await import("@/lib/gamify");
      xpAwarded = XP_REWARDS.MOCK_COMPLETE;
      if (score === total && total > 0) xpAwarded += XP_REWARDS.MOCK_PERFECT;
      await awardXp(user.id, xpAwarded);
      const badgeIds = await checkAndAwardBadges(user.id);
      newBadges = badgeIds.length > 0 ? await db.badge.findMany({ where: { id: { in: badgeIds } } }) : [];

      await logActivity(user.id, "mock_complete", `mockTestId=${mockTestId};score=${score}/${total}`, timeTakenSec);

      const updatedUser = await db.user.findUnique({ where: { id: user.id } });
      userStats = {
        xp: updatedUser?.xp,
        level: updatedUser?.level,
        streak: updatedUser?.streak,
      };
    } else {
      // Admin/mentor: just log the test preview, no XP
      await logActivity(user.id, "mock_test_complete", `mockTestId=${mockTestId};score=${score}/${total};role=${user.role}`, timeTakenSec);
    }

    return NextResponse.json({
      attemptId: isStudent ? "recorded" : "test-mode",
      score,
      total,
      percent: total > 0 ? Math.round((score / total) * 100) : 0,
      detail,
      xpAwarded,
      newBadges,
      userStats,
      isTestMode: !isStudent,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
