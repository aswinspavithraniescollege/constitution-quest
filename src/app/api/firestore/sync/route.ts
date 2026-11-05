import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/gamify";

// POST /api/firestore/sync — sync user data to Firestore (called from client when XP changes, etc.)
// This uses the Firestore REST API to write data server-side (no Firebase Auth required on client)
// Body: { type: "leaderboard" | "activity", data: {...} }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, data } = await req.json();
    const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/nptel-constitution-of-india/databases/(default)/documents`;

    if (type === "leaderboard") {
      // Update leaderboard entry
      const docData = {
        fields: {
          userId: { stringValue: user.id },
          name: { stringValue: user.name },
          username: { stringValue: user.username || "" },
          email: { stringValue: user.email || "" },
          xp: { integerValue: String(user.xp) },
          level: { integerValue: String(user.level) },
          streak: { integerValue: String(user.streak) },
          collegeCode: { stringValue: user.college?.code || "" },
          deptCode: { stringValue: user.department?.code || "" },
          collegeName: { stringValue: user.college?.name || "" },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      };
      const res = await fetch(`${FIRESTORE_URL}/leaderboard/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Firestore leaderboard sync error:", err);
        return NextResponse.json({ error: "Failed to sync leaderboard" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "activity") {
      // Add activity entry
      const docData = {
        fields: {
          userId: { stringValue: user.id },
          userName: { stringValue: user.name },
          userRole: { stringValue: user.role },
          action: { stringValue: data.action || "" },
          details: { stringValue: data.details || "" },
          collegeCode: { stringValue: user.college?.code || "" },
          collegeName: { stringValue: user.college?.name || "" },
          timestamp: { timestampValue: new Date().toISOString() },
        },
      };
      const res = await fetch(`${FIRESTORE_URL}/activityFeed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Firestore activity sync error:", err);
        return NextResponse.json({ error: "Failed to sync activity" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "mock_ranking") {
      // Update mock test ranking
      const docId = `${data.mockTestId}_${user.id}`;
      const fields: any = {
        mockTestId: { stringValue: data.mockTestId },
        mockTestTitle: { stringValue: data.mockTestTitle || "" },
        userId: { stringValue: user.id },
        userName: { stringValue: user.name },
        collegeCode: { stringValue: user.college?.code || "" },
        score: { integerValue: String(data.score || 0) },
        total: { integerValue: String(data.total || 0) },
        status: { stringValue: data.status || "in_progress" },
        startedAt: { timestampValue: data.startedAt || new Date().toISOString() },
      };
      if (data.status === "completed") {
        fields.completedAt = { timestampValue: new Date().toISOString() };
      }
      const res = await fetch(`${FIRESTORE_URL}/mockRankings/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Firestore mock ranking sync error:", err);
        return NextResponse.json({ error: "Failed to sync mock ranking" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown sync type" }, { status: 400 });
  } catch (e) {
    console.error("Firestore sync error:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
