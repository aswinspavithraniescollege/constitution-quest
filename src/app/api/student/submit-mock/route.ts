import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardXp, checkAndAwardBadges, logActivity, XP_REWARDS } from "@/lib/gamify";

// GET /api/student/submit-mock?mockTestId= - get mock test questions (no answers)
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
  if (user.role === "STUDENT") {
    await logActivity(user.id, "mock_start", `mockTestId=${id}`);
  }
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
  });
}

// POST /api/student/submit-mock - submit answers
// Body: { mockTestId, answers: { questionId: option }, timeTakenSec }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
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
    let xpAwarded = XP_REWARDS.MOCK_COMPLETE;
    if (score === total && total > 0) xpAwarded += XP_REWARDS.MOCK_PERFECT;
    await awardXp(user.id, xpAwarded);
    const newBadges = await checkAndAwardBadges(user.id);
    await logActivity(user.id, "mock_complete",
      `mockTestId=${mockTestId};score=${score}/${total}`,
      timeTakenSec);
    const updatedUser = await db.user.findUnique({ where: { id: user.id }, include: { college: true, department: true } });
    const mockTestTitle = mt?.title || "Mock Test";

    // Sync to Firestore (leaderboard + activity + mock ranking)
    if (updatedUser) {
      const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
      // Update leaderboard
      fetch(`${FIRESTORE_URL}/leaderboard/${updatedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          userId: { stringValue: updatedUser.id },
          name: { stringValue: updatedUser.name },
          username: { stringValue: updatedUser.username || "" },
          xp: { integerValue: String(updatedUser.xp) },
          level: { integerValue: String(updatedUser.level) },
          streak: { integerValue: String(updatedUser.streak) },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          deptCode: { stringValue: updatedUser.department?.code || "" },
          collegeName: { stringValue: updatedUser.college?.name || "" },
          updatedAt: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
      // Add to activity feed
      fetch(`${FIRESTORE_URL}/activityFeed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          userId: { stringValue: updatedUser.id },
          userName: { stringValue: updatedUser.name },
          userRole: { stringValue: updatedUser.role },
          action: { stringValue: "mock_complete" },
          details: { stringValue: `🎯 ${mockTestTitle}: ${score}/${total}` },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          collegeName: { stringValue: updatedUser.college?.name || "" },
          timestamp: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
      // Update mock ranking
      const docId = `${mockTestId}_${updatedUser.id}`;
      fetch(`${FIRESTORE_URL}/mockRankings/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {
          mockTestId: { stringValue: mockTestId },
          mockTestTitle: { stringValue: mockTestTitle },
          userId: { stringValue: updatedUser.id },
          userName: { stringValue: updatedUser.name },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          score: { integerValue: String(score) },
          total: { integerValue: String(total) },
          status: { stringValue: "completed" },
          startedAt: { timestampValue: new Date(Date.now() - (timeTakenSec || 0) * 1000).toISOString() },
          completedAt: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      total,
      percent: total > 0 ? Math.round((score / total) * 100) : 0,
      detail,
      xpAwarded,
      newBadges: newBadges.length > 0 ? await db.badge.findMany({ where: { id: { in: newBadges } } }) : [],
      userStats: {
        xp: updatedUser?.xp,
        level: updatedUser?.level,
        streak: updatedUser?.streak,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
