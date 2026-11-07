import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// POST /api/student/activity - log arbitrary student/guest activity (page views, time spent etc.)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STUDENT" && user.role !== "GUEST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { action, details, durationSec } = await req.json();
    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });
    await logActivity(user.id, action, details, durationSec);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
