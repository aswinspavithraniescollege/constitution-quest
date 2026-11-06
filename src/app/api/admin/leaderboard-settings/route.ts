import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
// Used by the admin dashboard to render the toggle state for every college
// and department in one call.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const rows = await db.setting.findMany({
      where: { key: { startsWith: "lbvis:" } },
      select: { key: true, value: true },
    });
    const college: Record<string, boolean> = {};
    const department: Record<string, boolean> = {};
    const collegeForDept: Record<string, boolean> = {};
    for (const r of rows) {
      if (r.key.startsWith("lbvis:college-for-dept:")) {
        collegeForDept[r.key.slice("lbvis:college-for-dept:".length)] = r.value === "true";
      } else if (r.key.startsWith("lbvis:college:")) {
        college[r.key.slice("lbvis:college:".length)] = r.value === "true";
      } else if (r.key.startsWith("lbvis:dept:")) {
        department[r.key.slice("lbvis:dept:".length)] = r.value === "true";
      }
    }
    return NextResponse.json({ college, department, collegeForDept });
  } catch (e) {
    // Setting table may not exist yet — return empty (all default to visible).
    console.warn("leaderboard-settings: could not read settings:", e);
    return NextResponse.json({ college: {}, department: {}, collegeForDept: {} });
  }
}
