import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { setSetting, resetSettingsTableCache } from "@/lib/settings";

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

// DELETE /api/admin/colleges?id=... — delete a college (MAIN ADMIN only)
// Cannot delete if the college has any users (mentors, students, sub-admins)
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can delete colleges" }, { status: 403 });
  }
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "College id required" }, { status: 400 });
    }
    // Check if the college has any users
    const userCount = await db.user.count({ where: { collegeId: id } });
    if (userCount > 0) {
      return NextResponse.json({
        error: `Cannot delete this college because it has ${userCount} user(s) assigned (mentors, students, or sub-admins). Please delete or reassign those users first.`,
      }, { status: 400 });
    }
    // Check if the college has any departments
    const deptCount = await db.department.count({ where: { collegeId: id } });
    if (deptCount > 0) {
      return NextResponse.json({
        error: `Cannot delete this college because it has ${deptCount} department(s). Please delete those departments first.`,
      }, { status: 400 });
    }
    await db.college.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete college" }, { status: 500 });
  }
}

// PATCH /api/admin/colleges — update a college (MAIN ADMIN only)
// Body: { id, name?, code?, location? }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can edit colleges" }, { status: 403 });
  }
  try {
    const { id, name, code, location, leaderboardVisible, leaderboardLocked } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "College id required" }, { status: 400 });
    }
    const college = await db.college.findUnique({ where: { id } });
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }
    // Check for duplicate name/code (excluding current)
    if (name || code) {
      const existing = await db.college.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(name ? [{ name }] : []),
                ...(code ? [{ code: code.toUpperCase() }] : []),
              ],
            },
          ],
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Another college with this name or code already exists" }, { status: 400 });
      }
    }
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code.toUpperCase();
    if (location !== undefined) data.location = location;
    const updated = await db.college.update({ where: { id }, data });

    // Toggle college leaderboard visibility for students.
    if (leaderboardVisible !== undefined) {
      try {
        await setSetting(`lbvis:college:${id}`, leaderboardVisible ? "true" : "false");
      } catch (e) {
        console.error("Failed to update college leaderboard visibility setting:", e);
        resetSettingsTableCache();
      }
    }

    // Toggle college leaderboard LOCK — when locked, mentors cannot toggle
    // the college LB for their department. Admin's setting is final.
    if (leaderboardLocked !== undefined) {
      try {
        await setSetting(`lbvis:college-locked:${id}`, leaderboardLocked ? "true" : "false");
      } catch (e) {
        console.error("Failed to update college leaderboard lock setting:", e);
        resetSettingsTableCache();
      }
    }

    return NextResponse.json({ college: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update college" }, { status: 500 });
  }
}
