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
    const updatedUser = await db.user.findUnique({ where: { id: user.id } });

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
