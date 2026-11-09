import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import {
  getHiddenFromDeptLeaderboardUserIds,
  getHiddenFromCollegeLeaderboardUserIds,
} from "@/lib/leaderboard-visibility";

// Force dynamic — never cache this response. The Student Preview polls
// this endpoint every 5 seconds and must always get fresh settings.
export const dynamic = 'force-dynamic';

// GET /api/student/leaderboard-config
// Returns everything the student leaderboard UI needs to render correctly:
//   - collegeLeaderboardVisible: bool   (controlled by main/sub admin)
//   - departmentLeaderboardVisible: bool (controlled by admin or the dept's mentor)
//   - collegeUserIds: string[]          (valid, active students in the student's college)
//   - departmentUserIds: string[]       (valid, active students in the student's department)
//   - hiddenFromDeptUserIds: string[]   (students who hid from dept LB — student viewers only)
//   - hiddenFromCollegeUserIds: string[] (students who hid from college LB — student viewers only)
//
// The Firestore `leaderboard` collection is real-time but can contain stale
// entries for deleted users. The client uses collegeUserIds/departmentUserIds
// to filter those out. These lists also scope the leaderboard to the
// student's own college/department (privacy: students only see their own
// college/department peers, never a global list).
//
// Query param: ?preview=student — used by the Student Preview feature so
// admins/mentors can see what a student would see. In preview mode, hidden
// students ARE filtered (to show the student's view).
export async function GET(req: NextRequest) {
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
      hiddenFromDeptUserIds: [],
      hiddenFromCollegeUserIds: [],
      reason: "You are not assigned to a college.",
    });
  }

  // Check if this is a preview request (?preview=student). Admins/mentors
  // use this to see what a student would see.
  const url = new URL(req.url);
  const previewMode = url.searchParams.get("preview") === "student";

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
  let collegeVisibleForMyDept = true; // mentor's per-dept toggle
  let collegeLocked = false; // admin lock — when true, mentor toggle is ignored
  try {
    const keys = [
      `lbvis:college:${user.collegeId}`,
      `lbvis:college-locked:${user.collegeId}`,
      ...(user.departmentId ? [
        `lbvis:dept:${user.departmentId}`,
        `lbvis:college-for-dept:${user.departmentId}`,
      ] : []),
    ];
    const map = await getSettings(keys);
    const cv = map.get(`lbvis:college:${user.collegeId}`);
    if (cv !== undefined) collegeVisible = cv === "true";
    const cl = map.get(`lbvis:college-locked:${user.collegeId}`);
    if (cl !== undefined) collegeLocked = cl === "true";
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

  // College LB visibility logic:
  // - Per-department toggle (lbvis:college-for-dept:{deptId}): controlled by
  //   both admin (per-dept College LB button) and mentor (College LB toggle).
  //   This is the PRIMARY control — if ON, student sees college LB.
  // - College-wide toggle (lbvis:college:{collegeId}): admin's master switch.
  //   Only relevant when LOCKED — when locked, admin's toggle is final.
  // - Admin lock (lbvis:college-locked:{collegeId}): when locked, mentor can't
  //   change the per-dept toggle, and admin's college-wide toggle is used.
  // - Unlocked: visible = per-dept toggle (mentor/admin per-dept control)
  // - Locked: visible = college-wide toggle (admin only)
  const collegeLbVisibleToStudent = collegeLocked
    ? collegeVisible
    : collegeVisibleForMyDept;

  // Per-student hide toggles: students who hid themselves from the dept or
  // college leaderboard. These are filtered out for STUDENT viewers, but
  // mentors and admins ALWAYS see everyone (they need to monitor all students).
  // The client (realtime-leaderboard.tsx) uses these sets to filter.
  // For mentors/admins, we return empty sets (no filtering — they see all).
  // Wrapped in try/catch so this feature can NEVER crash the whole endpoint.
  const isPrivilegedViewer = user.role === "ADMIN" || user.role === "SUB_ADMIN" || user.role === "MENTOR";
  let hiddenFromDeptUserIds: string[] = [];
  let hiddenFromCollegeUserIds: string[] = [];
  if (!isPrivilegedViewer || previewMode) {
    try {
      const deptHidden = await getHiddenFromDeptLeaderboardUserIds();
      const collegeHidden = await getHiddenFromCollegeLeaderboardUserIds();
      hiddenFromDeptUserIds = Array.from(deptHidden);
      hiddenFromCollegeUserIds = Array.from(collegeHidden);
    } catch (e) {
      // Non-fatal — if we can't read hidden users, just show everyone.
      console.warn("leaderboard-config: could not fetch hidden user ids:", e);
    }
  }

  return NextResponse.json({
    collegeLeaderboardVisible: collegeLbVisibleToStudent,
    departmentLeaderboardVisible: departmentVisible && !!user.departmentId,
    // Separate flags for the preview
    collegeWideVisible: collegeVisible,
    collegeForDeptVisible: collegeVisibleForMyDept,
    collegeLocked,
    collegeUserIds,
    departmentUserIds,
    // Per-student hide toggles — only populated for student viewers.
    // Mentors/admins get empty arrays (they see everyone).
    hiddenFromDeptUserIds,
    hiddenFromCollegeUserIds,
    collegeCode: user.college?.code || null,
    deptCode: user.department?.code || null,
  });
}
