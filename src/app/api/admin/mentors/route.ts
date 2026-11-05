import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/mentors?collegeId=...
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
  const mentors = await db.user.findMany({
    where: {
      role: "MENTOR",
      ...(collegeId ? { collegeId } : {}),
    },
    include: {
      college: true,
      department: true,
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const safe = mentors.map(({ password, ...rest }: any) => rest);
  return NextResponse.json({ mentors: safe });
}

// POST - create mentor (admin-issued credentials fallback for mentors)
// Note: most mentors self-register via Firebase, but admin can create username/password accounts.
export async function POST(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { username, password, name, collegeId, departmentId, email, phone } = await req.json();
    if (!username || !password || !name || !collegeId) {
      return NextResponse.json({ error: "Username, password, name and collegeId required" }, { status: 400 });
    }
    // Sub-admins can only create mentors in their own college
    if (user.role === "SUB_ADMIN" && collegeId !== user.collegeId) {
      return NextResponse.json({ error: "You can only create mentors in your assigned college" }, { status: 403 });
    }
    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const mentor = await db.user.create({
      data: {
        username: username.trim(),
        password: hashed,
        authMethod: "LOCAL",
        name,
        role: "MENTOR",
        collegeId,
        departmentId: departmentId || null,
        email: email || null,
        phone: phone || null,
      },
      include: { college: true, department: true },
    });
    const { password: _, ...safe } = mentor;
    return NextResponse.json({ mentor: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create mentor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Sub-admins can only delete mentors in their college
  if (user.role === "SUB_ADMIN") {
    const mentor = await db.user.findUnique({ where: { id } });
    if (!mentor || mentor.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Mentor not found in your college" }, { status: 403 });
    }
  }
  const count = await db.user.count({ where: { mentorId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "Cannot delete mentor with students assigned" }, { status: 400 });
  }
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
