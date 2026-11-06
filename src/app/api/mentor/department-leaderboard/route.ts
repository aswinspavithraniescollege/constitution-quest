import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    const rows = await db.setting.findMany({
      where: {
        key: {
          in: [
            `lbvis:dept:${user.departmentId}`,
            `lbvis:college-for-dept:${user.departmentId}`,
          ],
        },
      },
    });
    const map = new Map(rows.map(r => [r.key, r.value]));
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
      if (typeof leaderboardVisible === "boolean") {
        await db.setting.upsert({
          where: { key: `lbvis:dept:${user.departmentId}` },
          update: { value: leaderboardVisible ? "true" : "false" },
          create: { key: `lbvis:dept:${user.departmentId}`, value: leaderboardVisible ? "true" : "false" },
        });
      }
      if (typeof collegeLeaderboardVisibleForDept === "boolean") {
        await db.setting.upsert({
          where: { key: `lbvis:college-for-dept:${user.departmentId}` },
          update: { value: collegeLeaderboardVisibleForDept ? "true" : "false" },
          create: { key: `lbvis:college-for-dept:${user.departmentId}`, value: collegeLeaderboardVisibleForDept ? "true" : "false" },
        });
      }
    } catch (e) {
      console.error("Failed to persist department leaderboard setting:", e);
      return NextResponse.json(
        { error: "Could not save the setting. Please run `npm run db:push` to create the Setting table." },
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
