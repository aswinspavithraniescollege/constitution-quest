import { db } from "./db";

// Ensures the "Setting" table exists before we try to read/write it.
// This is a self-healing fallback so the leaderboard visibility toggles work
// without requiring a manual `npm run db:push`. CREATE TABLE IF NOT EXISTS is
// idempotent and non-destructive — it only adds the table if missing.
//
// We cache the "table exists" flag in-process so we only run the DDL once per
// server instance. If the table is later dropped, the next failed upsert will
// reset the flag and retry.
let verified = false;

export async function ensureSettingsTable(): Promise<void> {
  if (verified) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
      );
    `);
    verified = true;
  } catch (e) {
    // If this fails (e.g. permissions), the caller's upsert will also fail and
    // surface the error. We don't set `verified` so the next call retries.
    console.error("ensureSettingsTable: CREATE TABLE failed:", e);
    throw e;
  }
}

// Reset the cached flag (used if an upsert fails so the next attempt retries).
export function resetSettingsTableCache() {
  verified = false;
}
