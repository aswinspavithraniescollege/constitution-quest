import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/colleges - list all colleges
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const colleges = await db.college.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { departments: true, users: true } },
    },
  });
  return NextResponse.json({ colleges });
}

// POST /api/admin/colleges - create new college
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
