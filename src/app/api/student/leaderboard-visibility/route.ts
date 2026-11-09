import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserLeaderboardVisibility,
  setUserDeptLeaderboardVisibility,
  setUserCollegeLeaderboardVisibility,
} from "@/lib/leaderboard-visibility";

// Force dynamic — never cache this response.
export const dynamic = 'force-dynamic';

// GET /api/student/leaderboard-visibility
// Returns the current user's hide-from-leaderboard settings.
// Available to STUDENT and GUEST users (guests don't appear in leaderboards
// anyway, but they can still call this without error).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT" && user.role !== "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const visibility = await getUserLeaderboardVisibility(user.id);
  return NextResponse.json(visibility);
}

// PATCH /api/student/leaderboard-visibility
// Body: { hideFromDeptLeaderboard?: boolean, hideFromCollegeLeaderboard?: boolean }
// Lets a student toggle their own visibility on the leaderboards.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "STUDENT" && user.role !== "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { hideFromDeptLeaderboard, hideFromCollegeLeaderboard } = body;

    if (typeof hideFromDeptLeaderboard === "boolean") {
      await setUserDeptLeaderboardVisibility(user.id, hideFromDeptLeaderboard);
    }
    if (typeof hideFromCollegeLeaderboard === "boolean") {
      await setUserCollegeLeaderboardVisibility(user.id, hideFromCollegeLeaderboard);
    }

    const visibility = await getUserLeaderboardVisibility(user.id);
    return NextResponse.json(visibility);
  } catch (e) {
    console.error("leaderboard-visibility PATCH error:", e);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }
}
