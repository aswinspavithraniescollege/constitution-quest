import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

function csvEscape(s: any): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/admin/export?type=students|activity|mock|mentors&collegeId=
// - Main admin: optional collegeId filter
// - Sub-admin: forced to their collegeId
export async function GET(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "students";
  // Sub-admins always scoped to their college
  const collegeId = user.role === "SUB_ADMIN" ? user.collegeId! : (url.searchParams.get("collegeId") || "");

  let headers: string[] = [];
  let rows: any[][] = [];
  let filename = "export.csv";

  if (type === "students") {
    filename = "students.csv";
    const students = await db.user.findMany({
      where: {
        role: "STUDENT",
        ...(collegeId ? { collegeId } : {}),
      },
      include: {
        college: true,
        department: true,
        mentor: { select: { name: true, username: true } },
        _count: {
          select: { practiceAttempts: true, mockAttempts: true, activityLogs: true, studentBadges: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    headers = ["Username", "Name", "Email", "College", "Department", "RollNo", "Mentor", "Phone", "XP", "Level", "Streak", "LongestStreak", "PracticeCount", "MockCount", "BadgeCount", "LoginCount", "AuthMethod", "Active", "CreatedAt", "LastLogin"];
    rows = students.map(s => [
      s.username || "", s.name, s.email || "", s.college?.name, s.department?.name, s.rollNumber,
      s.mentor?.name || "", s.phone,
      s.xp, s.level, s.streak, s.longestStreak,
      s._count.practiceAttempts, s._count.mockAttempts, s._count.studentBadges,
      s._count.activityLogs, s.authMethod, s.active ? "Yes" : "No",
      s.createdAt.toISOString(), s.lastLoginAt?.toISOString() || "",
    ]);
  } else if (type === "activity") {
    filename = "activity.csv";
    const logs = await db.activityLog.findMany({
      where: collegeId ? { user: { collegeId } } : undefined,
      include: {
        user: {
          select: {
            name: true, username: true, role: true,
            college: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    headers = ["Timestamp", "Username", "Name", "Role", "College", "Department", "Action", "Details", "DurationSec"];
    rows = logs.map(l => [
      l.createdAt.toISOString(), l.user.username || l.user.email || "", l.user.name, l.user.role,
      l.user.college?.name || "", l.user.department?.name || "",
      l.action, l.details || "", l.durationSec || "",
    ]);
  } else if (type === "mock") {
    filename = "mock_attempts.csv";
    const attempts = await db.mockTestAttempt.findMany({
      where: collegeId ? { user: { collegeId } } : undefined,
      include: {
        user: {
          select: {
            name: true, username: true,
            college: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        mockTest: { select: { title: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 5000,
    });
    headers = ["Timestamp", "Username", "Name", "College", "Department", "MockTest", "Score", "Total", "Percent", "TimeTakenSec"];
    rows = attempts.map(a => [
      a.completedAt?.toISOString() || a.startedAt.toISOString(),
      a.user.username || a.user.email || "", a.user.name, a.user.college?.name || "", a.user.department?.name || "",
      a.mockTest.title, a.score, a.totalQuestions,
      a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0,
      a.timeTakenSec,
    ]);
  } else if (type === "mentors") {
    filename = "mentors.csv";
    const mentors = await db.user.findMany({
      where: { role: "MENTOR", ...(collegeId ? { collegeId } : {}) },
      include: {
        college: true,
        department: true,
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    headers = ["Username", "Name", "Email", "College", "Department", "Phone", "StudentsCount", "AuthMethod", "Active", "CreatedAt"];
    rows = mentors.map(m => [
      m.username || "", m.name, m.email || "", m.college?.name, m.department?.name,
      m.phone, m._count.students, m.authMethod, m.active ? "Yes" : "No",
      m.createdAt.toISOString(),
    ]);
  }

  const csv = [
    headers.join(","),
    ...rows.map(r => r.map(csvEscape).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
