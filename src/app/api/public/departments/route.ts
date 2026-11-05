import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/departments?collegeId=...
// Public endpoint for the signup form.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const collegeId = url.searchParams.get("collegeId");
  if (!collegeId) {
    return NextResponse.json({ departments: [] });
  }
  const departments = await db.department.findMany({
    where: { collegeId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  return NextResponse.json({ departments });
}
