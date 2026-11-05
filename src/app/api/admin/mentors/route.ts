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
// POST - create mentor (admin-issued credentials)
// Admin creates mentor with username/password. A unique mentorCode is auto-generated.
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

    // Generate a unique mentor code: MENTOR-COLLEGE-CODE-XXXX
    const college = await db.college.findUnique({ where: { id: collegeId } });
    const dept = departmentId ? await db.department.findUnique({ where: { id: departmentId } }) : null;
    const prefix = `MENTOR-${college?.code || "XXX"}-${dept?.code || "GEN"}`;
    // Find the next available number
    let codeNum = 1;
    let mentorCode = `${prefix}-${String(codeNum).padStart(3, "0")}`;
    while (await db.user.findUnique({ where: { mentorCode } })) {
      codeNum++;
      mentorCode = `${prefix}-${String(codeNum).padStart(3, "0")}`;
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
        mentorCode,
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

  // Clean up Firestore data
  const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;
  fetch(`${FIRESTORE_URL}/leaderboard/${id}`, { method: "DELETE" }).catch(() => {});

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/mentors — update a mentor
// Body: { id, name?, departmentId?, email?, phone?, active?, password? }
export async function PATCH(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, name, departmentId, email, phone, active, password } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const mentor = await db.user.findUnique({ where: { id } });
    if (!mentor || mentor.role !== "MENTOR") {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    // Sub-admins can only edit mentors in their college
    if (user.role === "SUB_ADMIN" && mentor.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Mentor not found in your college" }, { status: 403 });
    }
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (departmentId !== undefined) data.departmentId = departmentId || null;
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (active !== undefined) data.active = active;
    if (password) data.password = await hashPassword(password);
    const updated = await db.user.update({
      where: { id },
      data,
      include: { college: true, department: true },
    });
    const { password: _, ...safe } = updated;
    return NextResponse.json({ mentor: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update mentor" }, { status: 500 });
  }
}
