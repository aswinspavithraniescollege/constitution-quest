import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyIdToken } from "@/lib/firebase-admin";
import { logActivity, updateStreak, awardXp, XP_REWARDS } from "@/lib/gamify";

// POST /api/auth/signup
// Body: { idToken, email, role, name, collegeId, departmentId, mentorId?, rollNumber?, phone? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, email, role, name, collegeId, departmentId, mentorId, rollNumber, phone } = body;

    // Validate required fields
    if (!idToken || !email || !role || !name || !collegeId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields. Please fill in all required fields." }, { status: 400 });
    }
    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can self-register. Mentors are created by the admin." }, { status: 400 });
    }
    if (!rollNumber) {
      return NextResponse.json({ error: "KTU register number is required for students." }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Verify the Firebase ID token
    const fbUser = await verifyIdToken(idToken);
    if (!fbUser) {
      return NextResponse.json({ error: "Authentication failed. Please try signing up again." }, { status: 401 });
    }
    if (fbUser.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch. Please try signing up again." }, { status: 400 });
    }

    // Verify the college exists
    const college = await db.college.findUnique({ where: { id: collegeId } });
    if (!college) {
      return NextResponse.json({ error: "Selected college does not exist." }, { status: 400 });
    }

    // Verify department belongs to the college
    const dept = await db.department.findUnique({ where: { id: departmentId } });
    if (!dept || dept.collegeId !== collegeId) {
      return NextResponse.json({ error: "Selected department is not part of the chosen college." }, { status: 400 });
    }

    // Verify mentor by mentorId (from dropdown) — must be in same college
    let mentor = null;
    if (mentorId) {
      mentor = await db.user.findUnique({ where: { id: mentorId } });
      if (!mentor || mentor.role !== "MENTOR") {
        return NextResponse.json({ error: "Selected mentor does not exist." }, { status: 400 });
      }
      if (mentor.collegeId !== collegeId) {
        return NextResponse.json({ error: "Selected mentor does not belong to your college." }, { status: 400 });
      }
      if (!mentor.active) {
        return NextResponse.json({ error: "This mentor account is inactive. Please contact your admin." }, { status: 400 });
      }
    }

    // Check if a User with this firebaseUid or email already exists in our DB
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { firebaseUid: fbUser.localId },
          ...(email ? [{ email: email.toLowerCase() }] : []),
        ],
      },
    });

    if (existing) {
      // If the Firebase account exists but DB record is incomplete, update it instead of failing
      if (existing.firebaseUid === fbUser.localId) {
        // Update the existing record with any missing info
        const updated = await db.user.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            collegeId: collegeId,
            departmentId,
            mentorId: mentor?.id || existing.mentorId,
            rollNumber: rollNumber || existing.rollNumber,
            phone: phone || existing.phone,
          },
          include: { college: true, department: true, mentor: true },
        });
        await createSession(updated.id);
        const { password: _, ...safeUser } = updated;
        return NextResponse.json({ user: safeUser });
      }
      return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 409 });
    }

    // Create the User record
    const user = await db.user.create({
      data: {
        firebaseUid: fbUser.localId,
        email: email.toLowerCase(),
        authMethod: "FIREBASE",
        name,
        role,
        collegeId,
        departmentId,
        mentorId: mentor?.id || null,
        rollNumber,
        phone: phone || null,
      },
      include: { college: true, department: true, mentor: true },
    });

    // Create session
    await createSession(user.id);
    await logActivity(user.id, "signup", `role=${role};college=${college.code};dept=${dept.code}`);
    if (user.role === "STUDENT") {
      await updateStreak(user.id);
      await awardXp(user.id, XP_REWARDS.DAILY_LOGIN);
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Sign up failed due to a server error. Please try again." }, { status: 500 });
  }
}
