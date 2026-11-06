import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// Authorization helper for mentor student-management endpoints.
// A mentor may only manage students whose departmentId matches the mentor's
// own departmentId. Mentors with no department assignment (departmentId=null)
// cannot manage any students (they're effectively unassigned).
async function authorizeStudentForMentor(studentId: string) {
  const mentor = await getCurrentUser();
  if (!mentor || mentor.role !== "MENTOR") {
    return { forbidden: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) };
  }
  if (!mentor.departmentId) {
    return {
      forbidden: NextResponse.json(
        { error: "You are not assigned to a department, so you cannot manage students. Please contact your admin." },
        { status: 403 }
      ),
    };
  }
  const student = await db.user.findUnique({
    where: { id: studentId },
    include: { college: true, department: true },
  });
  if (!student || student.role !== "STUDENT") {
    return { forbidden: NextResponse.json({ error: "Student not found" }, { status: 404 }) };
  }
  if (student.departmentId !== mentor.departmentId) {
    return {
      forbidden: NextResponse.json(
        { error: "This student is not in your department. You can only manage students in your own department." },
        { status: 403 }
      ),
    };
  }
  if (student.collegeId !== mentor.collegeId) {
    return {
      forbidden: NextResponse.json(
        { error: "This student is not in your college." },
        { status: 403 }
      ),
    };
  }
  return { mentor, student };
}

// GET /api/mentor/students - list mentor's students with stats
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
        select: {
          practiceAttempts: true,
          mockAttempts: true,
          activityLogs: true,
          studentBadges: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // For each student, also compute week-wise progress
  const enriched = await Promise.all(students.map(async s => {
    const practiceAttempts = await db.practiceAttempt.findMany({
      where: { userId: s.id },
      include: { question: { select: { weekId: true } } },
    });
    const mockAttempts = await db.mockTestAttempt.findMany({
      where: { userId: s.id },
      include: { mockTest: { select: { title: true } } },
    });
    const weekStats = new Map<string, { attempted: number; correct: number }>();
    for (const p of practiceAttempts) {
      if (!p.question) continue;
      const w = p.question.weekId;
      if (!weekStats.has(w)) weekStats.set(w, { attempted: 0, correct: 0 });
      const ws = weekStats.get(w)!;
      ws.attempted++;
      if (p.isCorrect) ws.correct++;
    }
    const recentActivity = await db.activityLog.findMany({
      where: { userId: s.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const { password, ...safe } = s;
    return {
      ...safe,
      weekStats: Array.from(weekStats.entries()).map(([weekId, stats]) => ({ weekId, ...stats })),
      mockAttempts: mockAttempts.map(m => ({
        id: m.id,
        title: m.mockTest.title,
        score: m.score,
        total: m.totalQuestions,
        completedAt: m.completedAt,
      })),
      recentActivity: recentActivity.map(a => ({
        action: a.action,
        details: a.details,
        timestamp: a.createdAt,
      })),
      lastLoginAt: s.lastLoginAt,
    };
  }));

  return NextResponse.json({ students: enriched });
}

// DELETE /api/mentor/students?id=<studentId>
// Deletes a student, but only if the student is in the mentor's own department.
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const auth = await authorizeStudentForMentor(id);
  if ("forbidden" in auth) return auth.forbidden;

  // Clean up Firestore leaderboard entry (best-effort, non-blocking)
  const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
  fetch(`${FIRESTORE_URL}/leaderboard/${id}`, { method: "DELETE" }).catch(() => {});

  try {
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Mentor delete student error:", e);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}

// PATCH /api/mentor/students
// Body: { id, name?, phone?, rollNumber?, active?, password? }
// Mentors can edit only their own department's students, and only a limited
// set of fields (no email/department/mentor reassignment — those stay with admin).
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, rollNumber, active, password } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const auth = await authorizeStudentForMentor(id);
    if ("forbidden" in auth) return auth.forbidden;

    const data: any = {};
    if (name !== undefined) {
      if (!String(name).trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      data.name = String(name).trim();
    }
    if (phone !== undefined) data.phone = phone ? String(phone) : null;
    if (rollNumber !== undefined) data.rollNumber = rollNumber ? String(rollNumber) : null;
    if (active !== undefined) data.active = Boolean(active);
    if (password) {
      if (String(password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      data.password = await hashPassword(String(password));
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, phone: true, rollNumber: true, active: true },
    });
    return NextResponse.json({ ok: true, student: updated });
  } catch (e) {
    console.error("Mentor update student error:", e);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
