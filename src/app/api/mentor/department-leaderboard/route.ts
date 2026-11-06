import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/mentor/department-leaderboard
// Returns the current leaderboard-visibility setting for the mentor's department
// (so the mentor dashboard can show the toggle state).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!user.departmentId) {
    return NextResponse.json({
      departmentLeaderboardVisible: true,
      hasDepartment: false,
      message: "You are not assigned to a department.",
    });
  }
  let visible = true;
  try {
    const row = await db.setting.findUnique({
      where: { key: `lbvis:dept:${user.departmentId}` },
    });
    if (row !== null) visible = row.value === "true";
  } catch (e) {
    // Setting table may not exist yet — default to visible.
    console.warn("department-leaderboard GET: could not read setting:", e);
  }
  return NextResponse.json({
    departmentLeaderboardVisible: visible,
    hasDepartment: true,
    departmentId: user.departmentId,
    departmentName: user.department?.name || null,
  });
}

// PATCH /api/mentor/department-leaderboard
// Body: { leaderboardVisible: bool }
// Lets a mentor toggle leaderboard visibility for THEIR OWN department only.
// Students in that department will see/hide the "My Department" leaderboard tab.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!user.departmentId) {
    return NextResponse.json(
      { error: "You are not assigned to a department, so you cannot toggle this setting." },
      { status: 403 }
    );
  }
  try {
    const { leaderboardVisible } = await req.json();
    if (typeof leaderboardVisible !== "boolean") {
      return NextResponse.json({ error: "leaderboardVisible (boolean) is required" }, { status: 400 });
    }
    try {
      await db.setting.upsert({
        where: { key: `lbvis:dept:${user.departmentId}` },
        update: { value: leaderboardVisible ? "true" : "false" },
        create: { key: `lbvis:dept:${user.departmentId}`, value: leaderboardVisible ? "true" : "false" },
      });
    } catch (e) {
      console.error("Failed to persist department leaderboard setting:", e);
      return NextResponse.json(
        { error: "Could not save the setting. Please run `npm run db:push` to create the Setting table." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      departmentLeaderboardVisible: leaderboardVisible,
      departmentId: user.departmentId,
    });
  } catch (e) {
    console.error("mentor department-leaderboard PATCH error:", e);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
