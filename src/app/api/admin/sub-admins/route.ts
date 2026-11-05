import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// Only the MAIN ADMIN can manage sub-admins
async function requireMainAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/sub-admins — list all sub-admins (main admin only)
export async function GET() {
  const admin = await requireMainAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const subAdmins = await db.user.findMany({
    where: { role: "SUB_ADMIN" },
    include: {
      college: true,
      _count: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const safe = subAdmins.map(({ password, ...rest }: any) => rest);
  return NextResponse.json({ subAdmins: safe });
}

// POST /api/admin/sub-admins — create a new sub-admin (main admin only)
// Body: { username, password, name, collegeId, email?, phone? }
export async function POST(req: NextRequest) {
  const admin = await requireMainAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { username, password, name, collegeId, email, phone } = await req.json();
    if (!username || !password || !name || !collegeId) {
      return NextResponse.json(
        { error: "Username, password, name and collegeId are required" },
        { status: 400 }
      );
    }
    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    // Verify college exists
    const college = await db.college.findUnique({ where: { id: collegeId } });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const subAdmin = await db.user.create({
      data: {
        username: username.trim(),
        password: hashed,
        authMethod: "LOCAL",
        name,
        role: "SUB_ADMIN",
        collegeId,
        email: email || null,
        phone: phone || null,
      },
      include: { college: true },
    });
    const { password: _, ...safe } = subAdmin;
    return NextResponse.json({ subAdmin: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create sub-admin" }, { status: 500 });
  }
}

// DELETE /api/admin/sub-admins?id=... — delete a sub-admin (main admin only)
export async function DELETE(req: NextRequest) {
  const admin = await requireMainAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
