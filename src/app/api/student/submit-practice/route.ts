import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardXp, checkAndAwardBadges, logActivity, XP_REWARDS } from "@/lib/gamify";

// POST /api/student/submit-practice
// Body: { questionId, selectedOption, timeTakenSec }
// Returns: { correct, correctOption, explanation, whyWrong..., xpAwarded, newBadges }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { questionId, selectedOption, timeTakenSec } = await req.json();
    if (!questionId || !selectedOption) {
      return NextResponse.json({ error: "questionId and selectedOption required" }, { status: 400 });
    }
    const question = await db.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const isCorrect = selectedOption === question.correctOption;
    const attempt = await db.practiceAttempt.create({
      data: {
        userId: user.id,
        questionId,
        selectedOption,
        isCorrect,
        timeTakenSec: timeTakenSec || null,
      },
    });
    const xpAwarded = isCorrect ? XP_REWARDS.CORRECT_ANSWER : XP_REWARDS.WRONG_ANSWER;
    await awardXp(user.id, xpAwarded);
    const newBadges = await checkAndAwardBadges(user.id);
    await logActivity(user.id, "practice_answer",
      `qid=${questionId};correct=${isCorrect};selected=${selectedOption}`,
      timeTakenSec);

    // Get updated user stats
    const updatedUser = await db.user.findUnique({ where: { id: user.id }, include: { college: true, department: true } });

    // Sync to Firestore (leaderboard + activity feed) — non-blocking
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
          action: { stringValue: "practice_answer" },
          details: { stringValue: `${isCorrect ? "✓" : "✗"} Week question` },
          collegeCode: { stringValue: updatedUser.college?.code || "" },
          collegeName: { stringValue: updatedUser.college?.name || "" },
          timestamp: { timestampValue: new Date().toISOString() },
        }}),
      }).catch(() => {});
    }

    return NextResponse.json({
      attemptId: attempt.id,
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
      whyWrongA: question.whyWrongA,
      whyWrongB: question.whyWrongB,
      whyWrongC: question.whyWrongC,
      whyWrongD: question.whyWrongD,
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
