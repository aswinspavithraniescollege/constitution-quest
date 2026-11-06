// ============================================================
// Chat library — real-time chat via Firestore with 24h auto-deletion.
//
// Chat scopes (chatId encodes the scope):
//   "global"              — global chat (all colleges)
//   "college:{collegeId}" — college-wide chat
//   "dept:{departmentId}" — department chat (students + mentor)
//   "mentor:{collegeId}"  — mentors-only chat for a college
//
// Messages auto-delete after 24 hours (CHAT_TTL_MS). The cleanup runs:
//   1. Client-side: messages older than 24h are filtered out of display.
//   2. On subscribe: a best-effort cleanup deletes old messages from Firestore.
//
// Visibility is controlled by Setting rows (chatvis:*) — see the API endpoints
// /api/chat/config, /api/admin/chat-settings, /api/mentor/chat-settings.
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
  Timestamp,
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

// Messages auto-delete after 24 hours.
const CHAT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Build the chatId for a given scope.
export function chatIdFor(scope: "global" | "college" | "dept" | "mentor", id?: string | null): string {
  switch (scope) {
    case "global": return "global";
    case "college": return `college:${id}`;
    case "dept": return `dept:${id}`;
    case "mentor": return `mentor:${id}`;
  }
}

// Subscribe to a chat (real-time). Returns an unsubscribe function.
// Also runs a best-effort cleanup of messages older than 24h.
export function subscribeToChat(
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  maxMessages: number = 200
): () => void {
  if (!db) { callback([]); return () => {}; }
  try {
    const cutoff = new Date(Date.now() - CHAT_TTL_MS);
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(maxMessages)
    );

    // Best-effort cleanup: delete messages older than 24h.
    // Runs once on subscribe (not on every snapshot).
    cleanupOldMessages(chatId).catch(() => {});

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const d = doc.data() as any;
        // Client-side TTL filter: skip messages older than 24h.
        const created = d.createdAt?.toMillis?.() || d.createdAt?.seconds * 1000 || 0;
        if (created > 0 && now - created > CHAT_TTL_MS) return; // skip old
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
      console.error("Chat subscription error:", err);
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
      text: msg.text.trim().slice(0, 1000), // cap at 1000 chars
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

// Best-effort cleanup: delete messages older than 24h from a chat.
// Called on subscribe. Non-blocking — errors are swallowed.
async function cleanupOldMessages(chatId: string): Promise<void> {
  if (!db) return;
  try {
    const cutoff = new Date(Date.now() - CHAT_TTL_MS);
    // Query for old messages. Note: Firestore requires a composite index for
    // this query, but orderBy("createdAt") + where("createdAt", "<", cutoff)
    // should work without one if we use just the where clause.
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("createdAt", "<", cutoff)
    );
    const snap = await getDocs(q);
    const deletes = snap.docs.map(d => deleteDoc(d.ref).catch(() => {}));
    await Promise.all(deletes);
  } catch (e) {
    // Non-fatal — old messages just won't be cleaned up this round.
    // They're filtered client-side anyway.
  }
}
