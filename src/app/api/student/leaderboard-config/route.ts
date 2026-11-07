import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// GET /api/student/leaderboard-config
// Returns everything the student leaderboard UI needs to render correctly:
//   - collegeLeaderboardVisible: bool   (controlled by main/sub admin)
//   - departmentLeaderboardVisible: bool (controlled by admin or the dept's mentor)
//   - collegeUserIds: string[]          (valid, active students in the student's college)
//   - departmentUserIds: string[]       (valid, active students in the student's department)
//
// The Firestore `leaderboard` collection is real-time but can contain stale
// entries for deleted users. The client uses collegeUserIds/departmentUserIds
// to filter those out. These lists also scope the leaderboard to the
// student's own college/department (privacy: students only see their own
// college/department peers, never a global list).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Allow admins and mentors to fetch this endpoint too — it's used by the
  // Student Preview feature to show what students see. We treat the caller
  // as if they were a student in their own college/department.
  if (!user.collegeId) {
    return NextResponse.json({
      collegeLeaderboardVisible: false,
      departmentLeaderboardVisible: false,
      collegeUserIds: [],
      departmentUserIds: [],
      reason: "You are not assigned to a college.",
    });
  }

  // Read visibility settings. Default to visible if no setting row exists.
  // Wrapped in try/catch so the feature degrades gracefully if the Setting
  // table hasn't been created yet (e.g., prisma db push not yet run).
  //
  // Three keys are relevant:
  //   lbvis:college:{collegeId}               — college-wide toggle (admin)
  //   lbvis:dept:{departmentId}               — department leaderboard toggle (admin/mentor)
  //   lbvis:college-for-dept:{departmentId}   — per-department override: can students in
  //                                             THIS department see the COLLEGE leaderboard?
  //                                             (admin + that department's mentor)
  let collegeVisible = true;
  let departmentVisible = true;
  let collegeVisibleForMyDept = true; // per-dept override for the college leaderboard
  try {
    const keys = [
      `lbvis:college:${user.collegeId}`,
      ...(user.departmentId ? [
        `lbvis:dept:${user.departmentId}`,
        `lbvis:college-for-dept:${user.departmentId}`,
      ] : []),
    ];
    // Use raw-SQL getSettings so this works even if the Prisma Client in
    // production doesn't know about the Setting model.
    const map = await getSettings(keys);
    const cv = map.get(`lbvis:college:${user.collegeId}`);
    if (cv !== undefined) collegeVisible = cv === "true";
    if (user.departmentId) {
      const dv = map.get(`lbvis:dept:${user.departmentId}`);
      if (dv !== undefined) departmentVisible = dv === "true";
      const cfd = map.get(`lbvis:college-for-dept:${user.departmentId}`);
      if (cfd !== undefined) collegeVisibleForMyDept = cfd === "true";
    }
  } catch (e) {
    // Setting table missing or unreachable — default to visible (safe fallback).
    console.warn("leaderboard-config: could not read settings, defaulting to visible:", e);
  }

  // Fetch valid (non-deleted, active) student userIds in scope.
  // These power BOTH the deleted-user filter AND the college/department scoping.
  let collegeUserIds: string[] = [];
  let departmentUserIds: string[] = [];
  try {
    const collegeStudents = await db.user.findMany({
      where: { role: "STUDENT", active: true, collegeId: user.collegeId },
      select: { id: true },
    });
    collegeUserIds = collegeStudents.map(s => s.id);

    if (user.departmentId) {
      const deptStudents = await db.user.findMany({
        where: { role: "STUDENT", active: true, collegeId: user.collegeId, departmentId: user.departmentId },
        select: { id: true },
      });
      departmentUserIds = deptStudents.map(s => s.id);
    }
  } catch (e) {
    console.error("leaderboard-config: could not fetch student ids:", e);
  }

  // The college leaderboard tab is shown only if the college-wide toggle is ON
  // AND the student's own department hasn't opted out of the college leaderboard.
  const collegeLbVisibleToStudent = collegeVisible && collegeVisibleForMyDept;

  return NextResponse.json({
    collegeLeaderboardVisible: collegeLbVisibleToStudent,
    departmentLeaderboardVisible: departmentVisible && !!user.departmentId,
    collegeUserIds,
    departmentUserIds,
    collegeCode: user.college?.code || null,
    deptCode: user.department?.code || null,
  });
}
