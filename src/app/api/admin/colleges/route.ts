import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// Helper: returns the user if they are ADMIN (main) or SUB_ADMIN.
// Sub-admins have a collegeId and can only manage their own college.
async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/colleges — list colleges
// - Main admin: all colleges
// - Sub-admin: only their college
export async function GET() {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const where = user.role === "SUB_ADMIN" && user.collegeId ? { id: user.collegeId } : {};
  const colleges = await db.college.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { departments: true, users: true } },
    },
  });
  return NextResponse.json({ colleges });
}

// POST /api/admin/colleges — create new college (MAIN ADMIN only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can add colleges" }, { status: 403 });
  }
  try {
    const { name, code, location } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code required" }, { status: 400 });
    }
    const existing = await db.college.findFirst({
      where: { OR: [{ name }, { code: code.toUpperCase() }] },
    });
    if (existing) {
      return NextResponse.json({ error: "College with this name or code already exists" }, { status: 400 });
    }
    const college = await db.college.create({
      data: { name, code: code.toUpperCase(), location },
    });
    return NextResponse.json({ college });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create college" }, { status: 500 });
  }
}
