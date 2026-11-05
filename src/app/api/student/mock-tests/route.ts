import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// GET /api/student/mock-tests - list all available mock tests
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mockTests = await db.mockTest.findMany({
    orderBy: { createdAt: "asc" },
    include: { week: true },
  });
  // Count questions in each
  const safe = mockTests.map(mt => {
    const ids = JSON.parse(mt.questionIds) as string[];
    return {
      id: mt.id,
      title: mt.title,
      description: mt.description,
      durationMin: mt.durationMin,
      weekNumber: mt.week?.number || null,
      weekTitle: mt.week?.title || null,
      numQuestions: ids.length,
    };
  });
  return NextResponse.json({ mockTests: safe });
}
