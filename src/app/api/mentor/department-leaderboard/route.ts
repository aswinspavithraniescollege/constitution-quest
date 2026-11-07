import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, setSetting, resetSettingsTableCache } from "@/lib/settings";

// GET /api/mentor/department-leaderboard
// Returns the current leaderboard-visibility settings for the mentor's department.
// A mentor controls TWO toggles for their own department:
//   - departmentLeaderboardVisible:       the "My Department" leaderboard tab
//   - collegeLeaderboardVisibleForDept:   whether students in this department
//                                         can see the COLLEGE leaderboard
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!user.departmentId) {
    return NextResponse.json({
      departmentLeaderboardVisible: true,
      collegeLeaderboardVisibleForDept: true,
      hasDepartment: false,
      message: "You are not assigned to a department.",
    });
  }
  let deptVisible = true;
  let collegeForDeptVisible = true;
  try {
    const map = await getSettings([
      `lbvis:dept:${user.departmentId}`,
      `lbvis:college-for-dept:${user.departmentId}`,
    ]);
    const dv = map.get(`lbvis:dept:${user.departmentId}`);
    if (dv !== undefined) deptVisible = dv === "true";
    const cfd = map.get(`lbvis:college-for-dept:${user.departmentId}`);
    if (cfd !== undefined) collegeForDeptVisible = cfd === "true";
  } catch (e) {
    // Setting table may not exist yet — default to visible.
    console.warn("department-leaderboard GET: could not read settings:", e);
  }
  return NextResponse.json({
    departmentLeaderboardVisible: deptVisible,
    collegeLeaderboardVisibleForDept: collegeForDeptVisible,
    hasDepartment: true,
    departmentId: user.departmentId,
    departmentName: user.department?.name || null,
  });
}

// PATCH /api/mentor/department-leaderboard
// Body: { leaderboardVisible?: bool, collegeLeaderboardVisibleForDept?: bool }
// Lets a mentor toggle leaderboard visibility for THEIR OWN department only.
//   - leaderboardVisible:                 shows/hides the "My Department" tab
//   - collegeLeaderboardVisibleForDept:   shows/hides the "My College" tab for
//                                         students in this department only
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
    const { leaderboardVisible, collegeLeaderboardVisibleForDept } = await req.json();

    if (leaderboardVisible === undefined && collegeLeaderboardVisibleForDept === undefined) {
      return NextResponse.json(
        { error: "Provide leaderboardVisible or collegeLeaderboardVisibleForDept (boolean)." },
        { status: 400 }
      );
    }

    try {
      // setSetting self-heals the Setting table (CREATE TABLE IF NOT EXISTS)
      // before upserting, so the mentor can toggle without db:push.
      if (typeof leaderboardVisible === "boolean") {
        await setSetting(`lbvis:dept:${user.departmentId}`, leaderboardVisible ? "true" : "false");
      }
      if (typeof collegeLeaderboardVisibleForDept === "boolean") {
        await setSetting(`lbvis:college-for-dept:${user.departmentId}`, collegeLeaderboardVisibleForDept ? "true" : "false");
      }
    } catch (e) {
      console.error("Failed to persist department leaderboard setting:", e);
      resetSettingsTableCache(); // retry creation next time
      return NextResponse.json(
        { error: "Could not save the setting. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      departmentLeaderboardVisible: typeof leaderboardVisible === "boolean" ? leaderboardVisible : undefined,
      collegeLeaderboardVisibleForDept: typeof collegeLeaderboardVisibleForDept === "boolean" ? collegeLeaderboardVisibleForDept : undefined,
      departmentId: user.departmentId,
    });
  } catch (e) {
    console.error("mentor department-leaderboard PATCH error:", e);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
