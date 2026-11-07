import { db } from "./db";

// ============================================================
// Settings store — self-healing key/value table for feature flags.
//
// The Setting table may not exist in the database yet (e.g., the user hasn't
// run `npm run db:push`, or the Prisma Client in production doesn't know
// about the Setting model). To handle both cases, we:
//
//   1. ensureSettingsTable() — runs CREATE TABLE IF NOT EXISTS via raw SQL.
//      Idempotent + non-destructive. Cached in-process.
//   2. getSetting(key) / setSetting(key, value) — use RAW SQL ($queryRaw /
//      $executeRaw) instead of db.setting, so they work even if the Prisma
//      Client wasn't regenerated with the Setting model.
//
// This makes the leaderboard visibility toggles work out-of-the-box on any
// deployment without requiring db:push or prisma generate to have picked up
// the new model.
// ============================================================

let verified = false;

// Create the Setting table if it doesn't exist. Safe to call repeatedly.
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
    console.error("ensureSettingsTable: CREATE TABLE failed:", e);
    throw e;
  }
}

export function resetSettingsTableCache() {
  verified = false;
}

// Read a single setting. Returns null if the key doesn't exist or the table
// is missing (defaults to "visible"/"true" at the call site).
export async function getSetting(key: string): Promise<string | null> {
  try {
    await ensureSettingsTable();
    const rows = await db.$queryRaw<{ value: string }[]>`
      SELECT value FROM "Setting" WHERE key = ${key} LIMIT 1;
    `;
    return rows.length > 0 ? rows[0].value : null;
  } catch (e) {
    console.error(`getSetting(${key}) failed:`, e);
    resetSettingsTableCache();
    return null;
  }
}

// Read multiple settings at once. Returns a Map. Missing keys are absent
// from the map (callers treat absence as the default).
export async function getSettings(keys: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (keys.length === 0) return result;
  try {
    await ensureSettingsTable();
    // Use ANY with a parameterized array for safe IN-clause.
    const rows = await db.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "Setting" WHERE key = ANY(${keys}::text[]);
    `;
    for (const r of rows) result.set(r.key, r.value);
  } catch (e) {
    console.error("getSettings failed:", e);
    resetSettingsTableCache();
  }
  return result;
}

// Read all settings whose key starts with a prefix (e.g. "lbvis:").
// Returns a Map of key → value.
export async function getSettingsByPrefix(prefix: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    await ensureSettingsTable();
    const rows = await db.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "Setting" WHERE key LIKE ${prefix + '%'};
    `;
    for (const r of rows) result.set(r.key, r.value);
  } catch (e) {
    console.error(`getSettingsByPrefix(${prefix}) failed:`, e);
    resetSettingsTableCache();
  }
  return result;
}

// Upsert a setting. Creates the table first if needed.
export async function setSetting(key: string, value: string): Promise<void> {
  try {
    await ensureSettingsTable();
    // PostgreSQL upsert via raw SQL.
    await db.$executeRawUnsafe(
      `INSERT INTO "Setting" (key, value, "updatedAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW();`,
      key, value
    );
  } catch (e) {
    console.error(`setSetting(${key}) failed:`, e);
    resetSettingsTableCache();
    throw e;
  }
}
