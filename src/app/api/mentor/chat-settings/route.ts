import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, setSetting, resetSettingsTableCache } from "@/lib/settings";

// GET /api/mentor/chat-settings
// Returns the chat visibility settings the mentor can control:
//   - departmentLeaderboardVisible:       dept chat for their own department
//   - collegeChatVisible:                 college chat (for the mentor's college)
//   - mentorChatVisible:                  mentor chat for their college
// (Mentors cannot control the global chat — that's admin-only.)
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!user.departmentId) {
    return NextResponse.json({
      deptChatVisible: true,
      collegeChatVisible: true,
      mentorChatVisible: true,
      hasDepartment: false,
      message: "You are not assigned to a department.",
    });
  }
  const keys = [
    `chatvis:dept:${user.departmentId}`,
    ...(user.collegeId ? [
      `chatvis:college:${user.collegeId}`,
      `chatvis:mentor:${user.collegeId}`,
    ] : []),
  ];
  const map = await getSettings(keys);
  const chatvis = (key: string): boolean => map.get(key) !== "false";
  return NextResponse.json({
    deptChatVisible: chatvis(`chatvis:dept:${user.departmentId}`),
    collegeChatVisible: user.collegeId ? chatvis(`chatvis:college:${user.collegeId}`) : true,
    mentorChatVisible: user.collegeId ? chatvis(`chatvis:mentor:${user.collegeId}`) : true,
    hasDepartment: true,
    departmentId: user.departmentId,
    collegeId: user.collegeId,
    departmentName: user.department?.name || null,
    collegeName: user.college?.name || null,
  });
}

// PATCH /api/mentor/chat-settings
// Body: { scope: "dept"|"college"|"mentor", visible: bool }
// Mentors can toggle:
//   - dept chat for THEIR OWN department
//   - college chat for THEIR college
//   - mentor chat for THEIR college
// (Not global — admin only.)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!user.departmentId) {
    return NextResponse.json(
      { error: "You are not assigned to a department, so you cannot toggle these settings." },
      { status: 403 }
    );
  }
  try {
    const { scope, visible } = await req.json();
    if (!scope || typeof visible !== "boolean") {
      return NextResponse.json({ error: "scope and visible (boolean) required" }, { status: 400 });
    }

    let key: string;
    switch (scope) {
      case "dept":
        key = `chatvis:dept:${user.departmentId}`;
        break;
      case "college":
        if (!user.collegeId) return NextResponse.json({ error: "No college assigned" }, { status: 400 });
        key = `chatvis:college:${user.collegeId}`;
        break;
      case "mentor":
        if (!user.collegeId) return NextResponse.json({ error: "No college assigned" }, { status: 400 });
        key = `chatvis:mentor:${user.collegeId}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid scope. Use dept/college/mentor." }, { status: 400 });
    }

    try {
      await setSetting(key, visible ? "true" : "false");
    } catch (e) {
      console.error("Failed to persist chat setting:", e);
      resetSettingsTableCache();
      return NextResponse.json({ error: "Could not save the setting. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scope, visible });
  } catch (e) {
    console.error("mentor chat-settings PATCH error:", e);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
