import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Force dynamic — never cache this response. The Student Preview polls
// this endpoint every 5 seconds and must always get fresh settings.
export const dynamic = 'force-dynamic';

// GET /api/chat/config
// Returns which chat channels the current user can see, along with their
// visibility flags. The student/mentor/admin dashboard uses this to render
// the chat tabs.
//
// Chat types:
//   - global:         all users (controlled by admin)
//   - college:        users in the same college (controlled by admin)
//   - dept:           students + mentor in the same department (admin + mentor)
//   - dept-students:  STUDENTS ONLY in the same department — no mentor/admin
//                     (controlled by admin + mentor)
//   - mentor:         mentors in the same college (controlled by admin + mentors)
//   - dm:             private 1:1 between two users in the same department
//                     (controlled by admin + mentor)
//
// Visibility settings (Setting table):
//   chatvis:global                          — global chat on/off
//   chatvis:college:{collegeId}             — college chat on/off
//   chatvis:dept:{departmentId}             — department chat on/off
//   chatvis:dept-students:{departmentId}    — students-only dept chat on/off
//   chatvis:mentor:{collegeId}              — mentor chat on/off
//   chatvis:dm:{departmentId}               — DM chat on/off (per department)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support preview mode: ?preview=student — admin/mentor can see what a
  // student in their college/department would see. Used by StudentPreview.
  const url = new URL(req.url);
  const previewMode = url.searchParams.get("preview") === "student";

  // Guests are NOT shown any chat — they have no college connection and chat
  // is college/department scoped. The StudentApp also hides the Chat nav item
  // for guests, but we enforce it here too so the API is consistent.
  if (user.role === "GUEST") {
    return NextResponse.json({
      chats: [],
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        collegeCode: user.college?.code || null,
        deptCode: user.department?.code || null,
        departmentId: user.departmentId,
      },
      dm: {
        visible: false,
        recipients: [],
      },
    });
  }

  // isLearner = students (used for chat scoping). Guests are handled above.
  const isLearner = previewMode || user.role === "STUDENT";
  const isStudentStrict = previewMode || user.role === "STUDENT";
  const isMentor = !previewMode && user.role === "MENTOR";
  const isAdmin = !previewMode && user.role === "ADMIN";
  const isSubAdmin = !previewMode && user.role === "SUB_ADMIN";

  // Read all relevant visibility settings.
  const keys = [
    "chatvis:global",
    ...(user.collegeId ? [
      `chatvis:college:${user.collegeId}`,
      `chatvis:mentor:${user.collegeId}`,
    ] : []),
    ...(user.departmentId ? [
      `chatvis:dept:${user.departmentId}`,
      `chatvis:dept-students:${user.departmentId}`,
      `chatvis:dm:${user.departmentId}`,
    ] : []),
  ];
  const map = await getSettings(keys);

  const chatvis = (key: string): boolean => map.get(key) !== "false"; // default true

  // Determine which chats this user can see.
  const chats: { type: string; chatId: string; label: string; visible: boolean }[] = [];

  // Department chat — students + guests + mentors + admins with a department.
  if ((isLearner || isMentor || isAdmin || isSubAdmin) && user.departmentId) {
    chats.push({
      type: "dept",
      chatId: `dept:${user.departmentId}`,
      label: "My Department",
      visible: chatvis(`chatvis:dept:${user.departmentId}`),
    });
  }

  // Students-only department chat — STUDENTS ONLY (no mentor/admin/guest can see it).
  if (isStudentStrict && user.departmentId) {
    chats.push({
      type: "dept-students",
      chatId: `dept-students:${user.departmentId}`,
      label: "Students Only",
      visible: chatvis(`chatvis:dept-students:${user.departmentId}`),
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

  // DM chat — students (and mentors) can DM others in the same department.
  // We return a list of same-department users (students + the mentor) so the
  // UI can render a picker for private 1:1 DMs.
  // Guests are intentionally excluded — they have no college/department.
  let dmRecipients: { id: string; name: string; role: string }[] = [];
  let dmVisible = true;
  if (user.departmentId) {
    dmVisible = chatvis(`chatvis:dm:${user.departmentId}`);
    try {
      const peers = await db.user.findMany({
        where: {
          // Include students AND the mentor assigned to this department.
          // (Admins/sub-admins and guests are excluded — guests have no
          // department, and admins aren't part of the dept chat.)
          OR: [
            { role: "STUDENT", active: true, departmentId: user.departmentId },
            { role: "MENTOR", active: true, departmentId: user.departmentId },
          ],
          id: { not: user.id }, // exclude self
        },
        select: { id: true, name: true, role: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });
      dmRecipients = peers;
    } catch (e) {
      console.error("chat config: could not fetch DM recipients:", e);
    }
  }

  return NextResponse.json({
    chats,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      collegeCode: user.college?.code || null,
      deptCode: user.department?.code || null,
      departmentId: user.departmentId,
    },
    dm: {
      visible: dmVisible,
      recipients: dmRecipients, // same-department students (for the DM picker)
    },
  });
}
