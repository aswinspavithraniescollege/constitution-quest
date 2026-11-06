import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// GET /api/chat/config
// Returns which chat channels the current user can see, along with their
// visibility flags. The student/mentor/admin dashboard uses this to render
// the chat tabs.
//
// Chat types:
//   - global:    all users (controlled by admin)
//   - college:   users in the same college (controlled by admin)
//   - dept:      users in the same department (controlled by admin + mentor)
//   - mentor:    mentors in the same college (controlled by admin + mentors)
//
// Visibility settings (Setting table):
//   chatvis:global                    — global chat on/off
//   chatvis:college:{collegeId}       — college chat on/off
//   chatvis:dept:{departmentId}       — department chat on/off
//   chatvis:mentor:{collegeId}        — mentor chat on/off
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStudent = user.role === "STUDENT";
  const isMentor = user.role === "MENTOR";
  const isAdmin = user.role === "ADMIN";
  const isSubAdmin = user.role === "SUB_ADMIN";

  // Read all relevant visibility settings.
  const keys = [
    "chatvis:global",
    ...(user.collegeId ? [
      `chatvis:college:${user.collegeId}`,
      `chatvis:mentor:${user.collegeId}`,
    ] : []),
    ...(user.departmentId ? [`chatvis:dept:${user.departmentId}`] : []),
  ];
  const map = await getSettings(keys);

  const chatvis = (key: string): boolean => map.get(key) !== "false"; // default true

  // Determine which chats this user can see.
  const chats: { type: string; chatId: string; label: string; visible: boolean }[] = [];

  // Department chat — students + mentors + admins with a department.
  if ((isStudent || isMentor || isAdmin || isSubAdmin) && user.departmentId) {
    chats.push({
      type: "dept",
      chatId: `dept:${user.departmentId}`,
      label: "My Department",
      visible: chatvis(`chatvis:dept:${user.departmentId}`),
    });
  }

  // College chat — everyone in the college.
  if (user.collegeId) {
    chats.push({
      type: "college",
      chatId: `college:${user.collegeId}`,
      label: "My College",
      visible: chatvis(`chatvis:college:${user.collegeId}`),
    });
  }

  // Global chat — everyone.
  chats.push({
    type: "global",
    chatId: "global",
    label: "Global",
    visible: chatvis("chatvis:global"),
  });

  // Mentor chat — mentors only (within their college).
  if (isMentor && user.collegeId) {
    chats.push({
      type: "mentor",
      chatId: `mentor:${user.collegeId}`,
      label: "Mentors Only",
      visible: chatvis(`chatvis:mentor:${user.collegeId}`),
    });
  }

  return NextResponse.json({
    chats,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      collegeCode: user.college?.code || null,
      deptCode: user.department?.code || null,
    },
  });
}
