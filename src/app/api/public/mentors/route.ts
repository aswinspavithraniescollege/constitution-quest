import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/mentors?collegeId=...&departmentId=...
// Public endpoint for the signup form. Returns active mentors a student in the
// given college+department can choose from:
//   - mentors assigned to that specific department, AND
//   - mentors with no department (college-wide / general mentors)
// Mentors assigned to OTHER departments are excluded.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");
  if (!collegeId) {
    return NextResponse.json({ mentors: [] });
  }
  const departmentId = url.searchParams.get("departmentId");

  // If a department is specified, restrict to that department + college-wide
  // (null-department) mentors. If no department is specified, return all
  // mentors in the college (preserves the original behaviour for any caller
  // that only passes collegeId).
  const where = departmentId
    ? {
        role: "MENTOR" as const,
        collegeId,
        active: true,
        OR: [
          { departmentId },
          { departmentId: null },
        ],
      }
    : {
        role: "MENTOR" as const,
        collegeId,
        active: true,
      };

  const mentors = await db.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      department: { select: { name: true, code: true } },
    },
  });
  return NextResponse.json({ mentors });
}
