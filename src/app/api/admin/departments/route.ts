import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/departments?collegeId=...
// - Main admin: any college (filter optional)
// - Sub-admin: only their college (filter forced to their collegeId)
export async function GET(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  let collegeId = url.searchParams.get("collegeId");
  // Sub-admins can only see their own college
  if (user.role === "SUB_ADMIN") {
    collegeId = user.collegeId;
  }
  const departments = await db.department.findMany({
    where: collegeId ? { collegeId } : undefined,
    include: {
      college: true,
      _count: { select: { users: true } },
    },
    orderBy: [{ collegeId: "asc" }, { code: "asc" }],
  });
  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { name, code, collegeId } = await req.json();
    if (!name || !code || !collegeId) {
      return NextResponse.json({ error: "Name, code and collegeId required" }, { status: 400 });
    }
    // Sub-admins can only add departments to their own college
    if (user.role === "SUB_ADMIN" && collegeId !== user.collegeId) {
      return NextResponse.json(
        { error: "You can only manage departments in your assigned college" },
        { status: 403 }
      );
    }
    const existing = await db.department.findUnique({
      where: { code_collegeId: { code: code.toUpperCase(), collegeId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Department with this code already exists in this college" }, { status: 400 });
    }
    const dept = await db.department.create({
      data: { name, code: code.toUpperCase(), collegeId },
    });
    return NextResponse.json({ department: dept });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Verify the department belongs to the sub-admin's college
  if (user.role === "SUB_ADMIN") {
    const dept = await db.department.findUnique({ where: { id } });
    if (!dept || dept.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Department not found in your college" }, { status: 403 });
    }
  }
  const count = await db.user.count({ where: { departmentId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "Cannot delete department with users assigned" }, { status: 400 });
  }
  await db.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/departments — update a department
// Body: { id, name?, code? }
export async function PATCH(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, name, code, leaderboardVisible } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const dept = await db.department.findUnique({ where: { id } });
    if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    // Sub-admins can only edit departments in their college
    if (user.role === "SUB_ADMIN" && dept.collegeId !== user.collegeId) {
      return NextResponse.json({ error: "Department not found in your college" }, { status: 403 });
    }
    // Check for duplicate code within the same college (excluding current)
    if (code) {
      const existing = await db.department.findFirst({
        where: {
          collegeId: dept.collegeId,
          code: code.toUpperCase(),
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Department with this code already exists in this college" }, { status: 400 });
      }
    }
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code.toUpperCase();
    const updated = await db.department.update({ where: { id }, data });

    // Toggle department leaderboard visibility for students.
    // Stored as a Setting row: key = "lbvis:dept:{departmentId}", value = "true"/"false".
    if (leaderboardVisible !== undefined) {
      try {
        await db.setting.upsert({
          where: { key: `lbvis:dept:${id}` },
          update: { value: leaderboardVisible ? "true" : "false" },
          create: { key: `lbvis:dept:${id}`, value: leaderboardVisible ? "true" : "false" },
        });
      } catch (e) {
        console.error("Failed to update department leaderboard visibility setting:", e);
      }
    }

    return NextResponse.json({ department: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}
