"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, EyeOff, Users, User as UserIcon } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { chatIdFor } from "@/lib/chat";

type ChatEntry = { type: string; chatId: string; label: string; visible: boolean };
type DmRecipient = { id: string; name: string; role: string };

type ChatConfig = {
  chats: ChatEntry[];
  user: { id: string; name: string; role: string; collegeCode: string | null; deptCode: string | null; departmentId: string | null };
  dm: { visible: boolean; recipients: DmRecipient[] };
};

// ChatView — fetches the chat config for the current user and renders tabs
// for each visible chat. Used by students, mentors, and admins.
//
// Chat types (tabs shown depending on role + visibility):
//   - dept:           students + mentor + admins in the same department
//   - dept-students:  STUDENTS ONLY in the same department (no mentor/admin)
//   - college:        everyone in the same college
//   - global:         all users
//   - mentor:         mentors only (same college)
//   - dm:             private 1:1 — student picks a same-department peer
export function ChatView({ user }: { user: any }) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  // DM selection: the selected recipient's userId. When set, the DM chat panel
  // is shown instead of the tab list.
  const [dmRecipient, setDmRecipient] = useState<DmRecipient | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat/config");
        if (!res.ok) { if (!cancelled) setConfig(null); return; }
        const data = await res.json();
        if (cancelled) return;
        setConfig(data);
      } catch (e) {
        console.error("chat config fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (!config) {
    return (
      <div className="text-center py-16 text-white/40">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Couldn&apos;t load chat. Please try again later.</p>
      </div>
    );
  }

  // Only show chats that are visible (not toggled off by admin/mentor).
  const visibleChats = config.chats.filter(c => c.visible);

  // Check if DMs are enabled and the user has recipients.
  const dmEnabled = config.dm.visible && config.dm.recipients.length > 0;

  if (visibleChats.length === 0 && !dmEnabled) {
    return (
      <div className="text-center py-16 text-white/40">
        <EyeOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-bold text-white/60">All chats are currently disabled</p>
        <p className="text-sm mt-1">Your administrator can re-enable them.</p>
      </div>
    );
  }

  // If a DM recipient is selected, show the DM chat panel.
  if (dmRecipient && config.user.id) {
    const dmChatId = chatIdFor("dm", config.user.id, dmRecipient.id);
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-400" /> Direct message with {dmRecipient.name}
          </h2>
          <button
            onClick={() => setDmRecipient(null)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold"
          >
            ← Back to chats
          </button>
        </div>
        <ChatPanel
          chatId={dmChatId}
          chatType="dm"
          label={`DM: ${dmRecipient.name}`}
          user={config.user}
        />
      </div>
    );
  }

  const activeChat = visibleChats[Math.min(activeTab, visibleChats.length - 1)];

  return (
    <div>
      {/* Tabs */}
      {visibleChats.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {visibleChats.map((chat, i) => (
            <button
              key={chat.chatId}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                i === activeTab
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {chat.label}
            </button>
          ))}
        </div>
      )}

      {/* Active chat panel */}
      {activeChat && (
        <motion.div
          key={activeChat.chatId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <ChatPanel
            chatId={activeChat.chatId}
            chatType={activeChat.type}
            label={activeChat.label}
            user={config.user}
          />
        </motion.div>
      )}

      {/* DM section (students only — private 1:1 within same department) */}
      {dmEnabled && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-cyan-400" /> Direct Messages
            <span className="text-xs font-normal text-white/40">(same department only)</span>
          </h3>
          <p className="text-xs text-white/40 mb-3">Pick a classmate to start a private conversation. Messages auto-delete after 24 hours.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {config.dm.recipients.map((r) => (
              <button
                key={r.id}
                onClick={() => setDmRecipient(r)}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{r.name}</div>
                  <div className="text-[10px] text-white/40 uppercase">{r.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
