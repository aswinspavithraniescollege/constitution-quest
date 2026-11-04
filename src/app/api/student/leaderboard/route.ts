import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/student/leaderboard?scope=college|global&weekNumber=
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "college";

  const where: any = { role: "STUDENT", active: true };
  if (scope === "college" && user.collegeId) {
    where.collegeId = user.collegeId;
  }

  const top = await db.user.findMany({
    where,
    orderBy: [{ xp: "desc" }, { level: "desc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      username: true,
      xp: true,
      level: true,
      streak: true,
      longestStreak: true,
      college: { select: { name: true, code: true } },
      department: { select: { name: true, code: true } },
      _count: {
        select: { practiceAttempts: true, mockAttempts: true, studentBadges: true },
      },
    },
  });

  const ranked = top.map((u, i) => ({
    rank: i + 1,
    ...u,
    isCurrentUser: u.id === user.id,
  }));

  return NextResponse.json({ leaderboard: ranked, myRank: ranked.find(r => r.isCurrentUser)?.rank || null });
}
