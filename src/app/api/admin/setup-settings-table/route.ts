import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureSettingsTable } from "@/lib/settings";

// POST /api/admin/setup-settings-table
// Creates the "Setting" table if it doesn't exist yet. This lets the admin
// enable leaderboard visibility toggles from the UI without needing CLI access
// to run `npm run db:push`. Idempotent — safe to call multiple times.
//
// Main admin only. (The table also self-heals on first toggle from any role,
// but this endpoint gives the admin an explicit "create now" action.)
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can run setup" }, { status: 403 });
  }
  try {
    await ensureSettingsTable();
    return NextResponse.json({ ok: true, message: "Setting table is ready." });
  } catch (e: any) {
    console.error("setup-settings-table error:", e);
    return NextResponse.json(
      { error: "Could not create the Setting table: " + (e?.message || String(e)) },
      { status: 500 }
    );
  }
}
