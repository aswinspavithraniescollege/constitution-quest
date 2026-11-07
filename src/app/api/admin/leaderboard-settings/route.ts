import { NextResponse } from "next/server";
import { getSettingsByPrefix } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/leaderboard-settings
// Returns all leaderboard visibility settings as three maps:
//   {
//     college:              { [collegeId]: boolean },            // college-wide LB toggle
//     department:           { [departmentId]: boolean },         // department LB toggle
//     collegeForDept:       { [departmentId]: boolean }          // can this dept's students see the COLLEGE LB?
//   }
// Absence of a key in the returned maps means "default = visible (true)".
//
// Uses raw-SQL getSettingsByPrefix so this works even if the Prisma Client
// in production doesn't know about the Setting model.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const map = await getSettingsByPrefix("lbvis:");
    const college: Record<string, boolean> = {};
    const department: Record<string, boolean> = {};
    const collegeForDept: Record<string, boolean> = {};
    const collegeLocked: Record<string, boolean> = {};
    for (const [key, value] of map.entries()) {
      if (key.startsWith("lbvis:college-for-dept:")) {
        collegeForDept[key.slice("lbvis:college-for-dept:".length)] = value === "true";
      } else if (key.startsWith("lbvis:college-locked:")) {
        collegeLocked[key.slice("lbvis:college-locked:".length)] = value === "true";
      } else if (key.startsWith("lbvis:college:")) {
        college[key.slice("lbvis:college:".length)] = value === "true";
      } else if (key.startsWith("lbvis:dept:")) {
        department[key.slice("lbvis:dept:".length)] = value === "true";
      }
    }
    return NextResponse.json({ college, department, collegeForDept, collegeLocked });
  } catch (e) {
    console.warn("leaderboard-settings: could not read settings:", e);
    return NextResponse.json({ college: {}, department: {}, collegeForDept: {}, collegeLocked: {} });
  }
}
