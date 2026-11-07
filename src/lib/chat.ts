// ============================================================
// Chat library — real-time chat via Firestore with MIDNIGHT reset.
//
// Messages are deleted/reset at midnight every day. All messages
// from before today's midnight are filtered out and cleaned up.
//
// Chat scopes (chatId encodes the scope):
//   "global"                       — global chat
//   "college:{collegeId}"          — college-wide chat
//   "dept:{departmentId}"          — department chat (students + mentor)
//   "dept-students:{departmentId}" — students-only (no mentor)
//   "mentor:{collegeId}"           — mentors-only chat
//   "dm:{userIdA}_{userIdB}"       — private 1:1 (userIds sorted)
// ============================================================

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  collegeCode?: string;
  deptCode?: string;
  createdAt: any; // Firestore timestamp
};

// Get today's midnight (00:00:00 of the current day in local time).
// All messages from before this time are considered "old" and deleted.
function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

// Build the chatId for a given scope.
export function chatIdFor(scope: "global" | "college" | "dept" | "dept-students" | "mentor" | "dm", id?: string | null, id2?: string | null): string {
  switch (scope) {
    case "global": return "global";
    case "college": return `college:${id}`;
    case "dept": return `dept:${id}`;
    case "dept-students": return `dept-students:${id}`;
    case "mentor": return `mentor:${id}`;
    case "dm": {
      if (!id || !id2) return "";
      const [a, b] = [id, id2].sort();
      return `dm:${a}_${b}`;
    }
  }
}

// Subscribe to a chat (real-time). Returns an unsubscribe function.
// Also runs a best-effort cleanup of messages from before today's midnight.
export function subscribeToChat(
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  maxMessages: number = 200
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    const midnight = getTodayMidnight();
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(maxMessages)
    );

    // Best-effort cleanup: delete messages from before today's midnight.
    cleanupOldMessages(chatId).catch(() => {});

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      const midnightMs = midnight.getTime();
      snapshot.forEach((doc) => {
        const d = doc.data() as any;
        // Client-side filter: only show messages from today (after midnight).
        const created = d.createdAt?.toMillis?.() || d.createdAt?.seconds * 1000 || 0;
        if (created > 0 && created < midnightMs) return; // skip messages from before midnight
        messages.push({
          id: doc.id,
          userId: d.userId,
          userName: d.userName,
          userRole: d.userRole,
          text: d.text,
          collegeCode: d.collegeCode || "",
          deptCode: d.deptCode || "",
          createdAt: d.createdAt,
        });
      });
      // Reverse so oldest is at the top (chat UI order).
      messages.reverse();
      callback(messages);
    }, (err) => {
      console.error("Chat subscription error for chatId:", chatId, err);
      callback([]);
    });
  } catch (e) {
    console.error("subscribeToChat error:", e);
    callback([]);
    return () => {};
  }
}

// Send a message to a chat.
export async function sendChatMessage(
  chatId: string,
  msg: { userId: string; userName: string; userRole: string; text: string; collegeCode?: string; deptCode?: string }
): Promise<void> {
  if (!db) return;
  if (!msg.text.trim()) return;
  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      userId: msg.userId,
      userName: msg.userName,
      userRole: msg.userRole,
      text: msg.text.trim().slice(0, 1000),
      collegeCode: msg.collegeCode || "",
      deptCode: msg.deptCode || "",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("sendChatMessage error:", e);
    throw e;
  }
}

// Delete a message (own messages only — Firestore rules enforce this).
export async function deleteChatMessage(chatId: string, messageId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
  } catch (e) {
    console.error("deleteChatMessage error:", e);
    throw e;
  }
}

// Best-effort cleanup: delete messages from before today's midnight.
// Called on subscribe. Non-blocking — errors are swallowed.
async function cleanupOldMessages(chatId: string): Promise<void> {
  if (!db) return;
  try {
    const midnight = getTodayMidnight();
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("createdAt", "<", midnight)
    );
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(d.ref).catch(() => {}));
    await Promise.all(deletes);
  } catch (e) {
    // Non-fatal — old messages are filtered client-side anyway.
  }
}

// ============================================================
// UNREAD MESSAGE COUNTS — for notification badges
// ============================================================

// Get the last-read timestamp for a chat from localStorage.
// Returns 0 if never read (all today's messages are "unread").
export function getLastReadAt(chatId: string): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(`chatRead:${chatId}`);
  return val ? parseInt(val, 10) : 0;
}

// Mark a chat as read (store current timestamp in localStorage).
export function markChatAsRead(chatId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`chatRead:${chatId}`, String(Date.now()));
}

// Count unread messages in a chat (messages from other users, sent after
// lastReadAt and after today's midnight). One-time query (not real-time).
export async function getUnreadCount(
  chatId: string,
  currentUserId: string
): Promise<number> {
  if (!db) return 0;
  try {
    const lastRead = getLastReadAt(chatId);
    const midnight = getTodayMidnight();
    // The cutoff is the later of: lastReadAt and today's midnight
    const cutoff = new Date(Math.max(lastRead, midnight.getTime()));
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("createdAt", ">", cutoff)
    );
    const snap = await getDocs(q);
    let count = 0;
    snap.forEach((doc) => {
      const d = doc.data() as any;
      // Only count messages from OTHER users (not our own)
      if (d.userId !== currentUserId) count++;
    });
    return count;
  } catch (e) {
    console.error("getUnreadCount error:", e);
    return 0;
  }
}
