import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/weeks - list all weeks with topic & question counts
export async function GET() {
  const weeks = await db.week.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { questions: true, mockTests: true } },
      topics: { orderBy: { part: "asc" } },
    },
  });
  return NextResponse.json({ weeks });
}
