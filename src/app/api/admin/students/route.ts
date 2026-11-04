import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/students?collegeId=&departmentId=&mentorId=
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");
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

  const safe = students.map(({ password, ...rest }) => rest);
  return NextResponse.json({ students: safe });
}

// POST - create student
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { username, password, name, collegeId, departmentId, mentorId, email, phone, rollNumber } = await req.json();
    if (!username || !password || !name || !collegeId || !departmentId) {
      return NextResponse.json({ error: "username, password, name, collegeId and departmentId required" }, { status: 400 });
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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH - update student (e.g., toggle active, change mentor)
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, mentorId, active, password, name, departmentId, rollNumber } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data: any = {};
    if (mentorId !== undefined) data.mentorId = mentorId || null;
    if (active !== undefined) data.active = active;
    if (name !== undefined) data.name = name;
    if (departmentId !== undefined) data.departmentId = departmentId;
    if (rollNumber !== undefined) data.rollNumber = rollNumber;
    if (password) data.password = await hashPassword(password);
    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
