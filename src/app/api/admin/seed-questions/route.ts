import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SEED_WEEKS } from "@/lib/seed-questions";

// POST /api/admin/seed-questions
// Bulk-imports all 8 weeks, topics, ~200 questions, and 8 mock tests.
// Main admin only. Idempotent — if weeks already exist, they're skipped.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can seed questions" }, { status: 403 });
  }

  try {
    let weeksCreated = 0;
    let topicsCreated = 0;
    let questionsCreated = 0;
    let mockTestsCreated = 0;

    for (const seedWeek of SEED_WEEKS) {
      // Check if week already exists
      let week = await db.week.findUnique({ where: { number: seedWeek.number } });
      if (!week) {
        week = await db.week.create({
          data: {
            number: seedWeek.number,
            title: seedWeek.title,
            description: seedWeek.description,
          },
        });
        weeksCreated++;
      }

      // Create topics and questions
      const allQuestionIds: string[] = [];

      for (const seedTopic of seedWeek.topics) {
        // Check if topic already exists (by name + weekId)
        let topic = await db.topic.findFirst({
          where: { weekId: week.id, name: seedTopic.name },
        });
        if (!topic) {
          topic = await db.topic.create({
            data: {
              weekId: week.id,
              name: seedTopic.name,
              part: seedTopic.part,
            },
          });
          topicsCreated++;
        }

        // Create questions for this topic
        for (const q of seedTopic.questions) {
          // Check if question already exists (by text + weekId)
          const existing = await db.question.findFirst({
            where: { weekId: week.id, questionText: q.questionText },
          });
          if (!existing) {
            const newQ = await db.question.create({
              data: {
                weekId: week.id,
                topicId: topic.id,
                questionText: q.questionText,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctOption: q.correctOption,
                explanation: q.explanation,
                difficulty: q.difficulty,
                part: seedTopic.part,
              },
            });
            allQuestionIds.push(newQ.id);
            questionsCreated++;
          } else {
            allQuestionIds.push(existing.id);
          }
        }
      }

      // Create a mock test for this week (if it doesn't exist)
      const existingMock = await db.mockTest.findFirst({
        where: { weekId: week.id, title: `Week ${seedWeek.number}: ${seedWeek.title} - Mock Test` },
      });
      if (!existingMock && allQuestionIds.length > 0) {
        await db.mockTest.create({
          data: {
            title: `Week ${seedWeek.number}: ${seedWeek.title} - Mock Test`,
            description: `Mock test covering ${seedWeek.title}`,
            weekId: week.id,
            durationMin: 30,
            questionIds: JSON.stringify(allQuestionIds),
          },
        });
        mockTestsCreated++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Seed complete! Created ${weeksCreated} weeks, ${topicsCreated} topics, ${questionsCreated} questions, and ${mockTestsCreated} mock tests.`,
      stats: { weeksCreated, topicsCreated, questionsCreated, mockTestsCreated },
    });
  } catch (e: any) {
    console.error("Seed questions error:", e);
    return NextResponse.json(
      { error: "Failed to seed questions: " + (e?.message || String(e)) },
      { status: 500 }
    );
  }
}
