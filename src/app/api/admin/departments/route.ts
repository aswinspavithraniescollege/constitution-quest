import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/departments?collegeId=...
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");
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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { name, code, collegeId } = await req.json();
    if (!name || !code || !collegeId) {
      return NextResponse.json({ error: "Name, code and collegeId required" }, { status: 400 });
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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Check no users exist
  const count = await db.user.count({ where: { departmentId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "Cannot delete department with users assigned" }, { status: 400 });
  }
  await db.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
