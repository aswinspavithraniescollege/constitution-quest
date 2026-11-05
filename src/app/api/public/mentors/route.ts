import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/mentors?collegeId=...
// Public endpoint for the signup form. Returns active mentors in a given college.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");
  if (!collegeId) {
    return NextResponse.json({ mentors: [] });
  }
  const mentors = await db.user.findMany({
    where: { role: "MENTOR", collegeId, active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      department: { select: { name: true, code: true } },
    },
  });
  return NextResponse.json({ mentors });
}
