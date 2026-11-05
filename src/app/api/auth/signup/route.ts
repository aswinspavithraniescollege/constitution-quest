import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyIdToken } from "@/lib/firebase-admin";
import { logActivity, updateStreak, awardXp, XP_REWARDS } from "@/lib/gamify";

// POST /api/auth/signup
// Body: {
//   idToken,            // Firebase ID token from client
//   email,              // email used for Firebase signup
//   role,               // STUDENT | MENTOR
//   name,
//   collegeId,
//   departmentId,
//   mentorId?,          // required for STUDENT
//   rollNumber?,        // KTU register number, required for STUDENT
//   phone?,
// }
//
// Verifies the Firebase ID token, then creates a User record in our DB linked to the Firebase UID.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idToken,
      email,
      role,
      name,
      collegeId,
      departmentId,
      mentorId,
      rollNumber,
      phone,
    } = body;

    // Validate required fields
    if (!idToken || !email || !role || !name || !collegeId || !departmentId) {
      return NextResponse.json(
        { error: "Missing required fields. Please fill in all required fields." },
        { status: 400 }
      );
    }
    if (role !== "STUDENT" && role !== "MENTOR") {
      return NextResponse.json(
        { error: "Invalid role. Only students and mentors can self-register." },
        { status: 400 }
      );
    }
    if (role === "STUDENT" && !mentorId) {
      return NextResponse.json(
        { error: "Please select your mentor. Ask your admin if you don't see your mentor listed." },
        { status: 400 }
      );
    }
    if (role === "STUDENT" && !rollNumber) {
      return NextResponse.json(
        { error: "KTU register number is required for students." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token (this confirms the user actually signed up in Firebase)
    const fbUser = await verifyIdToken(idToken);
    if (!fbUser) {
      return NextResponse.json(
        { error: "Firebase authentication failed. Please try signing up again." },
        { status: 401 }
      );
    }
    if (fbUser.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email mismatch. The Firebase account email does not match the submitted email." },
        { status: 400 }
      );
    }
    if (!fbUser.emailVerified) {
      // We allow non-verified emails for now — Firebase has already created the account.
      // In production, you'd want to enforce email verification before allowing signups.
    }

    // Verify the college exists
    const college = await db.college.findUnique({ where: { id: collegeId } });
    if (!college) {
      return NextResponse.json({ error: "Selected college does not exist." }, { status: 400 });
    }

    // Verify department belongs to the college
    const dept = await db.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept || dept.collegeId !== collegeId) {
      return NextResponse.json(
        { error: "Selected department is not part of the chosen college." },
        { status: 400 }
      );
    }

    // Verify mentor (if student) — mentor must be in same college
    let mentor = null;
    if (role === "STUDENT" && mentorId) {
      mentor = await db.user.findUnique({ where: { id: mentorId } });
      if (!mentor || mentor.role !== "MENTOR" || mentor.collegeId !== collegeId) {
        return NextResponse.json(
          { error: "Selected mentor does not exist in this college." },
          { status: 400 }
        );
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
      return NextResponse.json(
        {
          error:
            existing.firebaseUid === fbUser.localId
              ? "An account with this Firebase login already exists. Please sign in instead."
              : "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
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
        mentorId: role === "STUDENT" ? mentorId : null,
        rollNumber: role === "STUDENT" ? rollNumber : null,
        phone: phone || null,
      },
      include: { college: true, department: true, mentor: true },
    });

    // Create session (cookie-based) so subsequent requests authenticate
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
    return NextResponse.json(
      { error: "Sign up failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
