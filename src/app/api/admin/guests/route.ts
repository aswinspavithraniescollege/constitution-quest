import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { cleanupUserFirestore } from "@/lib/firestore";

// Both MAIN ADMIN and SUB-ADMIN can manage guests.
// Sub-admins are scoped to their own college (if they assign one).
async function requireAdminLike() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUB_ADMIN") return null;
  return user;
}

// GET /api/admin/guests — list all guest accounts
// Main admin: all guests. Sub-admin: only guests in their college.
export async function GET(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  let collegeId = url.searchParams.get("collegeId");
  if (user.role === "SUB_ADMIN") {
    collegeId = user.collegeId;
  }
  const guests = await db.user.findMany({
    where: {
      role: "GUEST",
      ...(collegeId ? { collegeId } : {}),
    },
    include: {
      college: true,
      _count: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const safe = guests.map(({ password, ...rest }: any) => rest);
  return NextResponse.json({ guests: safe });
}

// POST /api/admin/guests — create a new guest account
// Body: { username, password, name, email?, phone? }
// Guests are external users (visitors, observers, external learners) who only
// get practice + mock test access — no college, no department, no chat, no
// leaderboard. collegeId/departmentId are intentionally NOT accepted here;
// guests are pure visitors with no college connection.
export async function POST(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { username, password, name, email, phone } = await req.json();
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Username, password and name are required" },
        { status: 400 }
      );
    }
    const existing = await db.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    // Guests are created with NO college/department — they're external visitors.
    const guest = await db.user.create({
      data: {
        username: username.trim(),
        password: hashed,
        authMethod: "LOCAL",
        name,
        role: "GUEST",
        collegeId: null,
        departmentId: null,
        email: email || null,
        phone: phone || null,
      },
      include: { college: true, department: true },
    });
    const { password: _, ...safe } = guest;
    return NextResponse.json({ guest: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}

// DELETE /api/admin/guests?id=... — delete a guest account
export async function DELETE(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Sub-admins can only delete guests in their college
  if (user.role === "SUB_ADMIN") {
    const guest = await db.user.findUnique({ where: { id } });
    if (!guest || guest.role !== "GUEST") {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    if (guest.collegeId && guest.collegeId !== user.collegeId) {
      return NextResponse.json(
        { error: "Guest not found in your college" },
        { status: 403 }
      );
    }
  }
  // Best-effort Firestore cleanup (profile, leaderboard, activity feed entries)
  try { await cleanupUserFirestore(id); } catch (e) { console.warn("Firestore cleanup:", e); }
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/guests — update a guest
// Body: { id, name?, collegeId?, departmentId?, email?, phone?, active?, password? }
export async function PATCH(req: NextRequest) {
  const user = await requireAdminLike();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id, name, collegeId, departmentId, email, phone, active, password } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const guest = await db.user.findUnique({ where: { id } });
    if (!guest || guest.role !== "GUEST") {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    // Sub-admins can only edit guests in their college
    if (user.role === "SUB_ADMIN" && guest.collegeId && guest.collegeId !== user.collegeId) {
      return NextResponse.json(
        { error: "Guest not found in your college" },
        { status: 403 }
      );
    }
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (collegeId !== undefined) data.collegeId = collegeId || null;
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
    return NextResponse.json({ guest: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}
