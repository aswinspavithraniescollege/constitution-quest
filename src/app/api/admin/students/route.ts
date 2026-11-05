import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/students?collegeId=&departmentId=&mentorId=
// - Main admin: any college (filter optional)
// - Sub-admin: forced to their college
export async function GET(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  let collegeId = url.searchParams.get("collegeId");
  if (user.role === "SUB_ADMIN") {
    collegeId = user.collegeId;
  }
  const departmentId = url.searchParams.get("departmentId");
  const mentorId = url.searchParams.get("mentorId");

  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      ...(collegeId ? { collegeId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(mentorId ? { mentorId } : {}),
    },
    include: {
      college: true,
      department: true,
      mentor: { select: { id: true, name: true, username: true } },
      _count: {
        select: {
          practiceAttempts: true,
          mockAttempts: true,
          studentBadges: true,
          activityLogs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const safe = students.map(({ password, ...rest }: any) => rest);
  return NextResponse.json({ students: safe });
}

// POST - create student (admin-issued credentials fallback)
// Note: most students self-register via Firebase, but admin can create username/password accounts
// for cases where the student has login issues.
export async function POST(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { username, password, name, collegeId, departmentId, mentorId, email, phone, rollNumber } = await req.json();
    if (!username || !password || !name || !collegeId || !departmentId) {
      return NextResponse.json({ error: "username, password, name, collegeId and departmentId required" }, { status: 400 });
    }
    // Sub-admins can only create students in their own college
    if (user.role === "SUB_ADMIN" && collegeId !== user.collegeId) {
      return NextResponse.json({ error: "You can only create students in your assigned college" }, { status: 403 });
    }
    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const student = await db.user.create({
      data: {
        username: username.trim(),
        password: hashed,
        authMethod: "LOCAL",
        name,
        role: "STUDENT",
        collegeId,
        departmentId,
        mentorId: mentorId || null,
        email: email || null,
        phone: phone || null,
        rollNumber: rollNumber || null,
      },
      include: { college: true, department: true, mentor: true },
    });
    const { password: _, ...safe } = student;
    return NextResponse.json({ student: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Sub-admins can only delete students in their college
  if (user.role === "SUB_ADMIN") {
    const student = await db.user.findUnique({ where: { id } });
    if (!student || student.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Student not found in your college" }, { status: 403 });
    }
  }
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH - update student
export async function PATCH(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, mentorId, active, password, name, departmentId, rollNumber, email, phone } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    // Sub-admins can only update students in their college
    if (user.role === "SUB_ADMIN") {
      const student = await db.user.findUnique({ where: { id } });
      if (!student || student.collegeId !== user.collegeId) {
        return NextResponse.json({ error: "Student not found in your college" }, { status: 403 });
      }
    }
    const data: any = {};
    if (mentorId !== undefined) data.mentorId = mentorId || null;
    if (active !== undefined) data.active = active;
    if (name !== undefined) data.name = name;
    if (departmentId !== undefined) data.departmentId = departmentId || null;
    if (rollNumber !== undefined) data.rollNumber = rollNumber || null;
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (password) data.password = await hashPassword(password);
    const updated = await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, user: { id: updated.id, name: updated.name } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
