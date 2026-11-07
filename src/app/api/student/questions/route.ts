import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// GET /api/student/questions?weekId=&topicId=&part=
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const weekId = url.searchParams.get("weekId");
  const topicId = url.searchParams.get("topicId");
  const part = url.searchParams.get("part");

  if (!weekId) return NextResponse.json({ error: "weekId required" }, { status: 400 });

  const where: any = { weekId };
  if (topicId) where.topicId = topicId;
  if (part) where.part = parseInt(part);

  const questions = await db.question.findMany({
    where,
    orderBy: [{ part: "asc" }, { createdAt: "asc" }],
    include: { topic: true },
  });

  // Get user's previous attempts for these questions
  // (allowed for both STUDENT and GUEST — both can practice)
  let userAttempts = new Map<string, boolean>();
  if (user.role === "STUDENT" || user.role === "GUEST") {
    const attempts = await db.practiceAttempt.findMany({
      where: { userId: user.id, questionId: { in: questions.map(q => q.id) } },
      orderBy: { createdAt: "desc" },
    });
    for (const a of attempts) {
      if (!userAttempts.has(a.questionId)) {
        userAttempts.set(a.questionId, a.isCorrect);
      }
    }
  }

  // Send questions WITHOUT correct answers (security)
  const safeQuestions = questions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    difficulty: q.difficulty,
    part: q.part,
    topic: q.topic?.name,
    weekId: q.weekId,
    previouslyAttempted: userAttempts.has(q.id),
    previouslyCorrect: userAttempts.get(q.id) || false,
  }));

  // Log activity (only for real students & guests — not admins/mentors previewing)
  if (user.role === "STUDENT" || user.role === "GUEST") {
    await logActivity(user.id, "practice_view", `weekId=${weekId}`);
  }

  return NextResponse.json({ questions: safeQuestions });
}
