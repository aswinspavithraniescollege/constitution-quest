import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/admin/setup-settings-table
// Creates the "Setting" table if it doesn't exist yet. This lets the admin
// enable leaderboard visibility toggles from the UI without needing CLI access
// to run `npm run db:push`. Idempotent — safe to call multiple times.
//
// Main admin only.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the main admin can run setup" }, { status: 403 });
  }
  try {
    // CREATE TABLE IF NOT EXISTS — non-destructive, only adds the table.
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
      );
    `);
    return NextResponse.json({ ok: true, message: "Setting table is ready." });
  } catch (e: any) {
    console.error("setup-settings-table error:", e);
    return NextResponse.json(
      { error: "Could not create the Setting table: " + (e?.message || String(e)) },
      { status: 500 }
    );
  }
}
