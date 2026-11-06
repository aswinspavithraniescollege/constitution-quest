import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettingsByPrefix, setSetting, resetSettingsTableCache } from "@/lib/settings";

// GET /api/admin/chat-settings
// Returns all chat visibility settings as maps:
//   { global: bool, college: {collegeId: bool}, dept: {deptId: bool}, mentor: {collegeId: bool} }
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const map = await getSettingsByPrefix("chatvis:");
    const global: Record<string, boolean> = {};
    const college: Record<string, boolean> = {};
    const dept: Record<string, boolean> = {};
    const deptStudents: Record<string, boolean> = {};
    const dm: Record<string, boolean> = {};
    const mentor: Record<string, boolean> = {};
    for (const [key, value] of map.entries()) {
      if (key === "chatvis:global") {
        global["global"] = value === "true";
      } else if (key.startsWith("chatvis:college:")) {
        college[key.slice("chatvis:college:".length)] = value === "true";
      } else if (key.startsWith("chatvis:dept-students:")) {
        deptStudents[key.slice("chatvis:dept-students:".length)] = value === "true";
      } else if (key.startsWith("chatvis:dm:")) {
        dm[key.slice("chatvis:dm:".length)] = value === "true";
      } else if (key.startsWith("chatvis:dept:")) {
        dept[key.slice("chatvis:dept:".length)] = value === "true";
      } else if (key.startsWith("chatvis:mentor:")) {
        mentor[key.slice("chatvis:mentor:".length)] = value === "true";
      }
    }
    return NextResponse.json({ global, college, dept, deptStudents, dm, mentor });
  } catch (e) {
    console.warn("chat-settings: could not read settings:", e);
    return NextResponse.json({ global: {}, college: {}, dept: {}, deptStudents: {}, dm: {}, mentor: {} });
  }
}

// PATCH /api/admin/chat-settings
// Body: { scope: "global"|"college"|"dept"|"mentor", id?: string, visible: bool }
//   - global: id not required
//   - college: id = collegeId
//   - dept: id = departmentId
//   - mentor: id = collegeId
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { scope, id, visible } = await req.json();
    if (!scope || typeof visible !== "boolean") {
      return NextResponse.json({ error: "scope and visible (boolean) required" }, { status: 400 });
    }

    let key: string;
    switch (scope) {
      case "global":
        key = "chatvis:global";
        break;
      case "college":
        if (!id) return NextResponse.json({ error: "id (collegeId) required for college scope" }, { status: 400 });
        // Sub-admins can only toggle their own college.
        if (user.role === "SUB_ADMIN" && id !== user.collegeId) {
          return NextResponse.json({ error: "You can only toggle your own college" }, { status: 403 });
        }
        key = `chatvis:college:${id}`;
        break;
      case "dept":
      case "dept-students":
      case "dm":
        if (!id) return NextResponse.json({ error: `id (departmentId) required for ${scope} scope` }, { status: 400 });
        // Sub-admins: dept must be in their college.
        if (user.role === "SUB_ADMIN") {
          const dept = await db.department.findUnique({ where: { id } });
          if (!dept || dept.collegeId !== user.collegeId) {
            return NextResponse.json({ error: "Department not in your college" }, { status: 403 });
          }
        }
        key = `chatvis:${scope}:${id}`;
        break;
      case "mentor":
        if (!id) return NextResponse.json({ error: "id (collegeId) required for mentor scope" }, { status: 400 });
        if (user.role === "SUB_ADMIN" && id !== user.collegeId) {
          return NextResponse.json({ error: "You can only toggle your own college" }, { status: 403 });
        }
        key = `chatvis:mentor:${id}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid scope. Use global/college/dept/dept-students/dm/mentor." }, { status: 400 });
    }

    try {
      await setSetting(key, visible ? "true" : "false");
    } catch (e) {
      console.error("Failed to persist chat setting:", e);
      resetSettingsTableCache();
      return NextResponse.json({ error: "Could not save the setting. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, key, visible });
  } catch (e) {
    console.error("admin chat-settings PATCH error:", e);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
