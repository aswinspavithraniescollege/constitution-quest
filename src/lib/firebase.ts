// Firebase client-side initialization
// Only Firebase Authentication is used (no Firestore or Storage)
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwRWgLkEgce8FhlquhB6yi9MTla35pvAI",
  authDomain: "nptel-constitution-of-india.firebaseapp.com",
  projectId: "nptel-constitution-of-india",
  storageBucket: "nptel-constitution-of-india.firebasestorage.app",
  messagingSenderId: "592780803462",
  appId: "1:592780803462:web:680f6fda5151639b234007",
};

let app: ReturnType<typeof initializeApp> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

// Initialize lazily so this file can be imported in any context
try {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
} catch (e) {
  console.error("Firebase init failed (this is OK during SSR):", e);
}

export { authInstance as auth, app };
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
};

export const FIREBASE_API_KEY = firebaseConfig.apiKey;
