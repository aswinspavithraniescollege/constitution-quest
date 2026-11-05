// Firebase client-side initialization
// Uses: Firebase Authentication + Firestore (real-time features)
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
import { getFirestore } from "firebase/firestore";

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
let dbInstance: ReturnType<typeof getFirestore> | null = null;

// Initialize lazily so this file can be imported in any context
try {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
} catch (e) {
  console.error("Firebase init failed (this is OK during SSR):", e);
}

export { authInstance as auth, app, dbInstance as db };
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
