"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Trash2, Users, Building2, Globe, GraduationCap } from "lucide-react";
import { subscribeToChat, sendChatMessage, deleteChatMessage, type ChatMessage } from "@/lib/chat";
import { timeAgo } from "@/lib/firestore";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-400/30",
  SUB_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-400/30",
  MENTOR: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
  STUDENT: "bg-amber-500/20 text-amber-300 border border-amber-400/30",
};

const CHAT_TYPE_ICONS: Record<string, any> = {
  dept: Users,
  college: Building2,
  global: Globe,
  mentor: GraduationCap,
};

// ChatPanel — reusable real-time chat UI.
// Props:
//   chatId: the Firestore chat ID (e.g. "dept:abc", "college:xyz", "global")
//   chatType: "dept" | "college" | "global" | "mentor"
//   label: display label for the chat
//   user: { id, name, role, collegeCode, deptCode }
export function ChatPanel({ chatId, chatType, label, user }: {
  chatId: string;
  chatType: string;
  label: string;
  user: any;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const Icon = CHAT_TYPE_ICONS[chatType] || MessageCircle;

  // Subscribe to real-time messages.
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToChat(chatId, (data) => {
      setMessages(data);
      setLoading(false);
    });
    return () => { unsub(); };
  }, [chatId]);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage(chatId, {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        text: text.trim(),
        collegeCode: user.collegeCode,
        deptCode: user.deptCode,
      });
      setText("");
    } catch (err: any) {
      console.error("Send failed:", err);
      const code = err?.code || "";
      let msg = "Could not send message.";
      if (code === "permission-denied") {
        msg = "Permission denied. Please log out and log back in, then try again. If it persists, ask the admin to deploy the Firestore rules.";
      } else if (code === "unavailable") {
        msg = "Service unavailable. Please try again.";
      } else if (err?.message) {
        msg = err.message;
      }
      toast.error(msg, { duration: 6000 });
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, user]);

  const handleDelete = useCallback(async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteChatMessage(chatId, msgId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [chatId]);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Icon className="w-5 h-5 text-cyan-400" /> {label} Chat
        </h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 p-2 rounded-xl bg-white/5 border border-white/10 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
            <p className="text-[10px] mt-1 opacity-60">Messages auto-delete after 24 hours.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.userId === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 ${isOwn ? "bg-cyan-500/20 border border-cyan-400/30" : "bg-white/5 border border-white/10"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white/80">{msg.userName}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${ROLE_COLORS[msg.userRole] || "bg-slate-500/20 text-slate-300 border border-slate-400/30"}`}>
                        {msg.userRole}
                      </span>
                      {msg.collegeCode && (
                        <span className="text-[9px] text-white/40">{msg.collegeCode}{msg.deptCode ? ` · ${msg.deptCode}` : ""}</span>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-white/30 hover:text-red-400 ml-auto"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-white/90 break-words whitespace-pre-wrap">{msg.text}</p>
                    <div className="text-[10px] text-white/30 mt-1 text-right">
                      {msg.createdAt ? timeAgo(msg.createdAt) : "now"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${label} chat...`}
          maxLength={1000}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      <p className="text-[10px] text-white/30 mt-2 text-center">
        Messages auto-delete after 24 hours · Be respectful · Your name and role are visible to others
      </p>
    </div>
  );
}
