"use client";

// Firestore helper library for all real-time features.
// All functions are client-side (use the Firestore SDK for real-time listeners).
//
// Collections:
// - leaderboard/{userId}           — Real-time leaderboard
// - activityFeed/{activityId}      — Live activity feed
// - forum_topics/{topicId}         — Discussion forum topics
// - forum_topics/{topicId}/posts/{postId} — Forum replies
// - notes/{userId}/items/{noteId}  — Student notes & bookmarks
// - announcements/{announcementId} — Announcements
// - mockRankings/{mockTestId}_{userId} — Live mock test rankings

import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ====== TYPES ======
export type LeaderboardEntry = {
  userId: string;
  name: string;
  username?: string;
  xp: number;
  level: number;
  streak: number;
  collegeCode?: string;
  deptCode?: string;
  collegeName?: string;
  updatedAt: any;
};

export type ActivityEntry = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
  collegeCode?: string;
  collegeName?: string;
  timestamp: any;
};

export type ForumTopic = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  weekNumber?: number;
  createdAt: any;
  postCount?: number;
};

export type ForumPost = {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: any;
};

export type StudentNote = {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  weekNumber: number;
  note: string;
  bookmarked: boolean;
  createdAt: any;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetCollegeId?: string;
  targetCollegeName?: string;
  createdAt: any;
};

export type MockRanking = {
  id: string;
  mockTestId: string;
  mockTestTitle: string;
  userId: string;
  userName: string;
  collegeCode?: string;
  score: number;
  total: number;
  status: "in_progress" | "completed";
  startedAt: any;
  completedAt?: any;
};

// ====== 1. LEADERBOARD ======

// Update a user's leaderboard entry (called when XP changes)
export async function updateLeaderboardEntry(entry: LeaderboardEntry) {
  if (!db) return;
  try {
    await setDoc(doc(db, "leaderboard", entry.userId), {
      userId: entry.userId,
      name: entry.name,
      username: entry.username || null,
      xp: entry.xp,
      level: entry.level,
      streak: entry.streak,
      collegeCode: entry.collegeCode || null,
      deptCode: entry.deptCode || null,
      collegeName: entry.collegeName || null,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("updateLeaderboardEntry error:", e);
  }
}

// Subscribe to leaderboard (real-time). Returns unsubscribe function.
// scope: "global" or "college" (filter by collegeCode)
export function subscribeToLeaderboard(
  scope: "global" | "college",
  collegeCode: string | null,
  callback: (entries: LeaderboardEntry[]) => void,
  maxResults: number = 50
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    let q;
    if (scope === "college" && collegeCode) {
      q = query(
        collection(db, "leaderboard"),
        where("collegeCode", "==", collegeCode),
        orderBy("xp", "desc"),
        limit(maxResults)
      );
    } else {
      q = query(
        collection(db, "leaderboard"),
        orderBy("xp", "desc"),
        limit(maxResults)
      );
    }
    return onSnapshot(q, (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as LeaderboardEntry;
        entries.push({ ...d, userId: doc.id });
      });
      callback(entries);
    }, (err) => {
      console.error("Leaderboard subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToLeaderboard error:", e);
    callback([]);
    return () => {};
  }
}

// ====== 2. ACTIVITY FEED ======

// Add an activity entry (called on any user action)
export async function addActivity(activity: Omit<ActivityEntry, "id" | "timestamp">) {
  if (!db) return;
  try {
    await addDoc(collection(db, "activityFeed"), {
      ...activity,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("addActivity error:", e);
  }
}

// Subscribe to activity feed (real-time). Returns unsubscribe function.
// scope: "global" or "college" (filter by collegeCode)
export function subscribeToActivityFeed(
  scope: "global" | "college",
  collegeCode: string | null,
  callback: (activities: ActivityEntry[]) => void,
  maxResults: number = 50
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    let q;
    if (scope === "college" && collegeCode) {
      q = query(
        collection(db, "activityFeed"),
        where("collegeCode", "==", collegeCode),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    } else {
      q = query(
        collection(db, "activityFeed"),
        orderBy("timestamp", "desc"),
        limit(maxResults)
      );
    }
    return onSnapshot(q, (snapshot) => {
      const activities: ActivityEntry[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as ActivityEntry;
        activities.push({ ...d, id: doc.id });
      });
      callback(activities);
    }, (err) => {
      console.error("Activity feed subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToActivityFeed error:", e);
    callback([]);
    return () => {};
  }
}

// ====== 3. DISCUSSION FORUM ======

// Create a new forum topic
export async function createForumTopic(topic: Omit<ForumTopic, "id" | "createdAt" | "postCount">): Promise<string | null> {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "forum_topics"), {
      ...topic,
      createdAt: serverTimestamp(),
      postCount: 0,
    });
    return docRef.id;
  } catch (e) {
    console.error("createForumTopic error:", e);
    return null;
  }
}

// Subscribe to forum topics (real-time)
export function subscribeToForumTopics(
  weekNumber: number | null,
  callback: (topics: ForumTopic[]) => void
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    let q;
    if (weekNumber) {
      q = query(
        collection(db, "forum_topics"),
        where("weekNumber", "==", weekNumber),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "forum_topics"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }
    return onSnapshot(q, (snapshot) => {
      const topics: ForumTopic[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as ForumTopic;
        topics.push({ ...d, id: doc.id });
      });
      callback(topics);
    }, (err) => {
      console.error("Forum topics subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToForumTopics error:", e);
    callback([]);
    return () => {};
  }
}

// Subscribe to posts in a topic (real-time)
export function subscribeToForumPosts(
  topicId: string,
  callback: (posts: ForumPost[]) => void
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    const q = query(
      collection(db, "forum_topics", topicId, "posts"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const posts: ForumPost[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as ForumPost;
        posts.push({ ...d, id: doc.id, topicId });
      });
      callback(posts);
    }, (err) => {
      console.error("Forum posts subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToForumPosts error:", e);
    callback([]);
    return () => {};
  }
}

// Add a post to a topic
export async function addForumPost(topicId: string, post: Omit<ForumPost, "id" | "createdAt" | "topicId">) {
  if (!db) return;
  try {
    await addDoc(collection(db, "forum_topics", topicId, "posts"), {
      ...post,
      createdAt: serverTimestamp(),
    });
    // Increment post count
    const topicRef = doc(db, "forum_topics", topicId);
    const topicDoc = await getDoc(topicRef);
    if (topicDoc.exists()) {
      const currentCount = (topicDoc.data() as ForumTopic).postCount || 0;
      await updateDoc(topicRef, { postCount: currentCount + 1 });
    }
  } catch (e) {
    console.error("addForumPost error:", e);
  }
}

// ====== 4. STUDENT NOTES & BOOKMARKS ======

// Subscribe to a user's notes (real-time)
export function subscribeToNotes(
  userId: string,
  callback: (notes: StudentNote[]) => void
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    const q = query(
      collection(db, "notes", userId, "items"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notes: StudentNote[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as StudentNote;
        notes.push({ ...d, id: doc.id, userId });
      });
      callback(notes);
    }, (err) => {
      console.error("Notes subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToNotes error:", e);
    callback([]);
    return () => {};
  }
}

// Save or update a note for a question
export async function saveNote(
  userId: string,
  questionId: string,
  data: { questionText: string; weekNumber: number; note: string; bookmarked: boolean }
) {
  if (!db) return;
  try {
    const noteRef = doc(db, "notes", userId, "items", questionId);
    await setDoc(noteRef, {
      userId,
      questionId,
      questionText: data.questionText,
      weekNumber: data.weekNumber,
      note: data.note,
      bookmarked: data.bookmarked,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error("saveNote error:", e);
  }
}

// Get a single note for a question
export async function getNote(userId: string, questionId: string): Promise<StudentNote | null> {
  if (!db) return null;
  try {
    const noteRef = doc(db, "notes", userId, "items", questionId);
    const noteDoc = await getDoc(noteRef);
    if (noteDoc.exists()) {
      return { ...(noteDoc.data() as StudentNote), id: noteDoc.id, userId };
    }
    return null;
  } catch (e) {
    console.error("getNote error:", e);
    return null;
  }
}

// Delete a note
export async function deleteNote(userId: string, questionId: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "notes", userId, "items", questionId));
  } catch (e) {
    console.error("deleteNote error:", e);
  }
}

// ====== 5. ANNOUNCEMENTS ======

// Create an announcement
export async function createAnnouncement(announcement: Omit<Announcement, "id" | "createdAt">): Promise<string | null> {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcement,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("createAnnouncement error:", e);
    return null;
  }
}

// Delete an announcement
export async function deleteAnnouncement(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "announcements", id));
  } catch (e) {
    console.error("deleteAnnouncement error:", e);
  }
}

// ====== CLEANUP: remove a user's Firestore data when their account is deleted ======
// Called from the CLIENT (browser) because the Firebase client SDK is
// authenticated, so Firestore security rules allow the deletes. The server-side
// REST cleanup in the API routes is unauthenticated and silently rejected by
// the rules — so this client-side function is what actually clears the data.
//
// Cleans up:
//   - leaderboard/{userId}
//   - mockRankings where userId == userId  (doc IDs are {mockTestId}_{userId})
//   - activityFeed where userId == userId
//   - notes/{userId}/items/{noteId}  (subcollection)
//
// Best-effort: each collection is tried independently and errors are collected.
// Returns a summary so the caller can surface a toast if anything failed.
export async function cleanupUserFirestore(userId: string): Promise<{
  ok: boolean;
  deleted: string[];
  failed: string[];
}> {
  if (!db) {
    return { ok: false, deleted: [], failed: ["leaderboard", "mockRankings", "activityFeed", "notes"] };
  }
  const deleted: string[] = [];
  const failed: string[] = [];

  // 1. Leaderboard entry (keyed directly by userId)
  try {
    await deleteDoc(doc(db, "leaderboard", userId));
    deleted.push("leaderboard");
  } catch (e) {
    console.error("cleanupUserFirestore: leaderboard delete failed:", e);
    failed.push("leaderboard");
  }

  // 2. Mock test rankings (query by userId field)
  try {
    const q = query(collection(db, "mockRankings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    deleted.push("mockRankings");
  } catch (e) {
    console.error("cleanupUserFirestore: mockRankings delete failed:", e);
    failed.push("mockRankings");
  }

  // 3. Activity feed entries (query by userId field)
  try {
    const q = query(collection(db, "activityFeed"), where("userId", "==", userId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    deleted.push("activityFeed");
  } catch (e) {
    console.error("cleanupUserFirestore: activityFeed delete failed:", e);
    failed.push("activityFeed");
  }

  // 4. Notes subcollection (notes/{userId}/items/{noteId})
  try {
    const q = collection(db, "notes", userId, "items");
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    deleted.push("notes");
  } catch (e) {
    console.error("cleanupUserFirestore: notes delete failed:", e);
    failed.push("notes");
  }

  return { ok: failed.length === 0, deleted, failed };
}

// Subscribe to announcements (real-time)
// If collegeId is provided, shows announcements targeted to that college + global ones
export function subscribeToAnnouncements(
  collegeId: string | null,
  callback: (announcements: Announcement[]) => void
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    // Get all announcements, filter client-side for targeted ones
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const announcements: Announcement[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as Announcement;
        // Show if: no target college (global) OR target matches user's college
        if (!d.targetCollegeId || d.targetCollegeId === collegeId) {
          announcements.push({ ...d, id: doc.id });
        }
      });
      callback(announcements);
    }, (err) => {
      console.error("Announcements subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToAnnouncements error:", e);
    callback([]);
    return () => {};
  }
}

// ====== 6. LIVE MOCK TEST RANKINGS ======

// Update mock test ranking entry (called when starting/completing a test)
export async function updateMockRanking(ranking: MockRanking) {
  if (!db) return;
  try {
    const docId = `${ranking.mockTestId}_${ranking.userId}`;
    await setDoc(doc(db, "mockRankings", docId), {
      ...ranking,
      startedAt: ranking.startedAt || serverTimestamp(),
      completedAt: ranking.status === "completed" ? serverTimestamp() : null,
    });
  } catch (e) {
    console.error("updateMockRanking error:", e);
  }
}

// Subscribe to mock test rankings (real-time)
export function subscribeToMockRankings(
  mockTestId: string,
  callback: (rankings: MockRanking[]) => void
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    const q = query(
      collection(db, "mockRankings"),
      where("mockTestId", "==", mockTestId)
    );
    return onSnapshot(q, (snapshot) => {
      const rankings: MockRanking[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as MockRanking;
        rankings.push({ ...d, id: doc.id });
      });
      // Sort: completed first (by score desc), then in-progress
      rankings.sort((a, b) => {
        if (a.status === "completed" && b.status === "completed") {
          const aPct = a.total > 0 ? a.score / a.total : 0;
          const bPct = b.total > 0 ? b.score / b.total : 0;
          return bPct - aPct;
        }
        if (a.status === "completed") return -1;
        if (b.status === "completed") return 1;
        return 0;
      });
      callback(rankings);
    }, (err) => {
      console.error("Mock rankings subscription error:", err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToMockRankings error:", e);
    callback([]);
    return () => {};
  }
}

// ====== HELPER: Convert Firestore timestamp to JS Date ======
export function timestampToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === "object" && ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === "string") return new Date(ts);
  return null;
}

export function timeAgo(ts: any): string {
  const date = timestampToDate(ts);
  if (!date) return "just now";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ====== USER PROFILE SYNC ======
// Called after Firebase login to create/update the user's profile in Firestore.
// This profile is used by the security rules to determine access.
export async function syncUserProfile(user: {
  id: string;        // internal DB userId
  name: string;
  role: string;      // ADMIN | SUB_ADMIN | MENTOR | STUDENT
  collegeId?: string | null;
  collegeCode?: string | null;
  collegeName?: string | null;
  username?: string | null;
  email?: string | null;
  firebaseUid: string;
}) {
  if (!db || !user.firebaseUid) return;
  try {
    await setDoc(doc(db, "userProfiles", user.firebaseUid), {
      userId: user.id,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId || "",
      collegeCode: user.collegeCode || "",
      collegeName: user.collegeName || "",
      username: user.username || "",
      email: user.email || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error("syncUserProfile error:", e);
  }
}

// ====== CLIENT-SIDE LEADERBOARD SYNC ======
// Called after XP changes (practice answer, mock test, daily login).
// The client writes directly to Firestore (authenticated).
export async function syncLeaderboardClient(user: {
  id: string;
  name: string;
  username?: string | null;
  xp: number;
  level: number;
  streak: number;
  collegeCode?: string | null;
  deptCode?: string | null;
  collegeName?: string | null;
}) {
  if (!db) return;
  try {
    await setDoc(doc(db, "leaderboard", user.id), {
      userId: user.id,
      name: user.name,
      username: user.username || "",
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      collegeCode: user.collegeCode || "",
      deptCode: user.deptCode || "",
      collegeName: user.collegeName || "",
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("syncLeaderboardClient error:", e);
  }
}

// ====== CLIENT-SIDE ACTIVITY SYNC ======
// Called after any user action (practice, mock, login, etc.)
export async function addActivityClient(activity: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
  collegeCode?: string;
  collegeName?: string;
}) {
  if (!db) return;
  try {
    await addDoc(collection(db, "activityFeed"), {
      ...activity,
      collegeId: activity.collegeCode || "", // Used by rules for college-based filtering
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("addActivityClient error:", e);
  }
}

// ====== CLIENT-SIDE MOCK RANKING SYNC ======
export async function syncMockRankingClient(ranking: {
  mockTestId: string;
  mockTestTitle: string;
  userId: string;
  userName: string;
  collegeCode?: string;
  score: number;
  total: number;
  status: "in_progress" | "completed";
  startedAt?: any;
}) {
  if (!db) return;
  try {
    const docId = `${ranking.mockTestId}_${ranking.userId}`;
    await setDoc(doc(db, "mockRankings", docId), {
      ...ranking,
      startedAt: ranking.startedAt || serverTimestamp(),
      completedAt: ranking.status === "completed" ? serverTimestamp() : null,
    });
  } catch (e) {
    console.error("syncMockRankingClient error:", e);
  }
}
