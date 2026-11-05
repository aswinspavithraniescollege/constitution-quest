import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/colleges — list all colleges for the signup form
// Public endpoint (no auth) so prospective students can see the list during signup.
export async function GET() {
  const colleges = await db.college.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      location: true,
    },
  });
  return NextResponse.json({ colleges });
}
