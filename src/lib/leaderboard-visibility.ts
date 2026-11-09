import { getSetting, setSetting, getSettingsByPrefix } from "./settings";

// ============================================================
// Leaderboard visibility helpers — per-student hide toggles.
//
// Each student has two independent toggles:
//   1. Hide from DEPARTMENT leaderboard
//   2. Hide from COLLEGE leaderboard
//
// Storage: Setting table (key-value, self-healing)
//   "lbhide:dept:{userId}"     → "true" | "false"  (absent = false = visible)
//   "lbhide:college:{userId}"  → "true" | "false"  (absent = false = visible)
//
// These are "common switches" — the same toggle is read/written by:
//   - The student themselves (via /api/student/leaderboard-visibility)
//   - Their mentor (via /api/mentor/students PATCH)
//   - Admins (via /api/admin/students PATCH)
//
// Effect:
//   - When hidden, the student's name/entry is filtered out of the
//     leaderboard for STUDENT viewers.
//   - Mentors and admins ALWAYS see the full leaderboard (hidden students
//     included) so they can monitor everyone. They can also filter.
// ============================================================

export type LeaderboardVisibility = {
  hideFromDeptLeaderboard: boolean;
  hideFromCollegeLeaderboard: boolean;
};

// Get a single user's visibility settings.
export async function getUserLeaderboardVisibility(userId: string): Promise<LeaderboardVisibility> {
  const deptKey = `lbhide:dept:${userId}`;
  const collegeKey = `lbhide:college:${userId}`;
  const [deptVal, collegeVal] = await Promise.all([
    getSetting(deptKey),
    getSetting(collegeKey),
  ]);
  return {
    hideFromDeptLeaderboard: deptVal === "true",
    hideFromCollegeLeaderboard: collegeVal === "true",
  };
}

// Get visibility settings for multiple users at once.
// Returns a Map of userId → LeaderboardVisibility.
export async function getBulkUserLeaderboardVisibility(userIds: string[]): Promise<Map<string, LeaderboardVisibility>> {
  const result = new Map<string, LeaderboardVisibility>();
  if (userIds.length === 0) return result;
  // Read all lbhide: settings and filter in-memory (simpler than building
  // a dynamic IN clause with hundreds of keys).
  const allSettings = await getSettingsByPrefix("lbhide:");
  for (const userId of userIds) {
    result.set(userId, {
      hideFromDeptLeaderboard: allSettings.get(`lbhide:dept:${userId}`) === "true",
      hideFromCollegeLeaderboard: allSettings.get(`lbhide:college:${userId}`) === "true",
    });
  }
  return result;
}

// Get ALL users who are hidden from the department leaderboard.
// Returns a Set of userIds.
export async function getHiddenFromDeptLeaderboardUserIds(): Promise<Set<string>> {
  const allSettings = await getSettingsByPrefix("lbhide:dept:");
  const result = new Set<string>();
  for (const [key, value] of allSettings) {
    if (value === "true") {
      // Extract userId from key: "lbhide:dept:{userId}"
      const userId = key.replace("lbhide:dept:", "");
      if (userId) result.add(userId);
    }
  }
  return result;
}

// Get ALL users who are hidden from the college leaderboard.
// Returns a Set of userIds.
export async function getHiddenFromCollegeLeaderboardUserIds(): Promise<Set<string>> {
  const allSettings = await getSettingsByPrefix("lbhide:college:");
  const result = new Set<string>();
  for (const [key, value] of allSettings) {
    if (value === "true") {
      const userId = key.replace("lbhide:college:", "");
      if (userId) result.add(userId);
    }
  }
  return result;
}

// Set a user's department leaderboard visibility.
export async function setUserDeptLeaderboardVisibility(userId: string, hidden: boolean): Promise<void> {
  await setSetting(`lbhide:dept:${userId}`, hidden ? "true" : "false");
}

// Set a user's college leaderboard visibility.
export async function setUserCollegeLeaderboardVisibility(userId: string, hidden: boolean): Promise<void> {
  await setSetting(`lbhide:college:${userId}`, hidden ? "true" : "false");
}
