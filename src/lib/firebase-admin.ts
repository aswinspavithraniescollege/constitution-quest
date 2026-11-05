// Server-side Firebase ID token verification using the public REST API.
// This avoids needing the Firebase Admin SDK (which requires a service account).
//
// Docs: https://firebase.google.com/docs/reference/rest/auth#section-get-account-info
//
// POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[API_KEY]
// Body: { idToken: "<token>" }
// Response: { users: [{ localId, email, ... }] } if valid; error otherwise.

import { FIREBASE_API_KEY } from "./firebase";

type FirebaseUser = {
  localId: string; // Firebase UID
  email: string;
  emailVerified: boolean;
  displayName?: string;
};

export async function verifyIdToken(idToken: string): Promise<FirebaseUser | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.users || data.users.length === 0) {
      return null;
    }
    const u = data.users[0];
    return {
      localId: u.localId,
      email: u.email,
      emailVerified: !!u.emailVerified,
      displayName: u.displayName || undefined,
    };
  } catch (e) {
    console.error("verifyIdToken failed:", e);
    return null;
  }
}
