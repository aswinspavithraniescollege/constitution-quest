"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, EyeOff } from "lucide-react";
import { ChatPanel } from "./chat-panel";

type ChatConfig = {
  chats: { type: string; chatId: string; label: string; visible: boolean }[];
  user: { id: string; name: string; role: string; collegeCode: string | null; deptCode: string | null };
};

// ChatView — fetches the chat config for the current user and renders tabs
// for each visible chat. Used by students, mentors, and admins.
//   - Students: dept, college, global
//   - Mentors: dept, college, global, mentor
//   - Admins: dept (if assigned), college, global, mentor
// Chats that are toggled off via admin/mentor settings are hidden.
export function ChatView({ user }: { user: any }) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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

  if (visibleChats.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <EyeOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-bold text-white/60">All chats are currently disabled</p>
        <p className="text-sm mt-1">Your administrator can re-enable them.</p>
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
      <motion.div
        key={activeChat.chatId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <ChatPanel
          chatId={activeChat.chatId}
          chatType={activeChat.type}
          label={activeChat.label}
          user={config.user}
        />
      </motion.div>
    </div>
  );
}
