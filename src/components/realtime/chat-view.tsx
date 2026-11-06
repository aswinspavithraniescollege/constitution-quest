"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, EyeOff, Users, User as UserIcon, GraduationCap, ArrowLeft } from "lucide-react";
import { ChatPanel } from "./chat-panel";
import { chatIdFor } from "@/lib/chat";

type ChatEntry = { type: string; chatId: string; label: string; visible: boolean };
type DmRecipient = { id: string; name: string; role: string };

type ChatConfig = {
  chats: ChatEntry[];
  user: { id: string; name: string; role: string; collegeCode: string | null; deptCode: string | null; departmentId: string | null };
  dm: { visible: boolean; recipients: DmRecipient[] };
};

const ROLE_BADGES: Record<string, { icon: any; color: string; label: string }> = {
  MENTOR: { icon: GraduationCap, color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30", label: "Mentor" },
  STUDENT: { icon: UserIcon, color: "bg-amber-500/20 text-amber-300 border-amber-400/30", label: "Student" },
};

// ChatView — fetches the chat config for the current user and renders either
// the group chat tabs OR the DM recipient picker. A top-level toggle switches
// between "Group Chats" and "Direct Messages".
export function ChatView({ user }: { user: any }) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  // "groups" = show group chat tabs; "dm-list" = show DM recipient picker
  const [view, setView] = useState<"groups" | "dm-list">("groups");
  // When a DM recipient is selected, we show the DM chat panel.
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

  const visibleChats = config.chats.filter(c => c.visible);
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

  // If a DM recipient is selected, show the private 1:1 chat panel.
  if (dmRecipient && config.user.id) {
    const dmChatId = chatIdFor("dm", config.user.id, dmRecipient.id);
    const RBadge = ROLE_BADGES[dmRecipient.role] || ROLE_BADGES.STUDENT;
    return (
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-black flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-400" /> Direct message with {dmRecipient.name}
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase flex items-center gap-1 ${RBadge.color}`}>
              <RBadge.icon className="w-3 h-3" /> {RBadge.label}
            </span>
          </h2>
          <button
            onClick={() => setDmRecipient(null)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
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

  // DM recipient picker view
  if (view === "dm-list") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Direct Messages
            <span className="text-xs font-normal text-white/40">(same department)</span>
          </h2>
          <button
            onClick={() => setView("groups")}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Group Chats
          </button>
        </div>
        <p className="text-xs text-white/40 mb-4">
          Pick someone to start a private 1:1 conversation. Messages auto-delete after 24 hours.
        </p>
        {config.dm.recipients.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No one else is in your department yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {config.dm.recipients.map((r) => {
              const badge = ROLE_BADGES[r.role] || ROLE_BADGES.STUDENT;
              const BIcon = badge.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setDmRecipient(r)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition text-left"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${r.role === "MENTOR" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-cyan-500 to-blue-500"}`}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{r.name}</div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${badge.color}`}>
                      <BIcon className="w-2.5 h-2.5" /> {badge.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: group chats view
  const activeChat = visibleChats[Math.min(activeTab, visibleChats.length - 1)];

  return (
    <div>
      {/* Top-level toggle: Group Chats vs Direct Messages */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("groups")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
          }`}
        >
          <MessageCircle className="w-4 h-4" /> Group Chats
        </button>
        {dmEnabled && (
          <button
            onClick={() => setView("dm-list")}
            className="px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white"
          >
            <Users className="w-4 h-4" /> Direct Messages
            <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.5 rounded-full">
              {config.dm.recipients.length}
            </span>
          </button>
        )}
      </div>

      {/* Group chat tabs (My Department, Students Only, My College, Global, etc.) */}
      {visibleChats.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {visibleChats.map((chat, i) => (
            <button
              key={chat.chatId}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                i === activeTab
                  ? "bg-white/10 border border-cyan-400/30 text-white"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {chat.label}
            </button>
          ))}
        </div>
      )}

      {/* Active group chat panel */}
      {activeChat && (
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
      )}
    </div>
  );
}
