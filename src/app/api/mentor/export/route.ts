import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function csvEscape(s: any): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/mentor/export - export mentor's students data as CSV
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const students = await db.user.findMany({
    where: { mentorId: user.id, role: "STUDENT" },
    include: {
      department: true,
      _count: {
        select: { practiceAttempts: true, mockAttempts: true, activityLogs: true, studentBadges: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Username", "Name", "Department", "RollNo", "Email", "Phone", "XP", "Level", "Streak", "PracticeCount", "MockCount", "BadgeCount", "LoginCount", "LastLogin", "CreatedAt"];
  const rows = students.map(s => [
    s.username, s.name, s.department?.name, s.rollNumber, s.email, s.phone,
    s.xp, s.level, s.streak,
    s._count.practiceAttempts, s._count.mockAttempts, s._count.studentBadges,
    s._count.activityLogs,
    s.lastLoginAt?.toISOString() || "",
    s.createdAt.toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(r => r.map(csvEscape).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mentor_${user.username}_students.csv"`,
    },
  });
}
