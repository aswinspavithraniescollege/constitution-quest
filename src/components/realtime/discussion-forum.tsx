"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MessageCircle, Plus, Loader2, ChevronLeft, Send, BookOpen, GraduationCap, Shield, User as UserIcon } from "lucide-react";
import {
  subscribeToForumTopics, subscribeToForumPosts, createForumTopic, addForumPost,
  timeAgo, type ForumTopic, type ForumPost,
} from "@/lib/firestore";

const ROLE_ICONS: Record<string, any> = { ADMIN: Shield, SUB_ADMIN: Shield, MENTOR: GraduationCap, STUDENT: UserIcon };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700", SUB_ADMIN: "bg-purple-100 text-purple-700",
  MENTOR: "bg-emerald-100 text-emerald-700", STUDENT: "bg-amber-100 text-amber-700",
};

export function DiscussionForum({ user, weekNumber }: { user: any; weekNumber?: number }) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToForumTopics(weekNumber || null, (data) => { setTopics(data); setLoading(false); });
    return () => { unsub(); };
  }, [weekNumber]);

  if (selectedTopic) {
    return <TopicView topic={selectedTopic} user={user} onBack={() => setSelectedTopic(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2"><MessageCircle className="w-6 h-6 text-cyan-300" /> Discussion Forum</h2>
        <button onClick={() => setShowNewTopic(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm flex items-center gap-2 hover:scale-105 transition">
          <Plus className="w-4 h-4" /> New Topic
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div> :
        topics.length === 0 ? (
          <div className="text-center py-16 text-white/40"><MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No discussions yet. Start the conversation!</p></div>
        ) : (
          <div className="space-y-2">
            {topics.map((t, i) => {
              const RIcon = ROLE_ICONS[t.authorRole] || UserIcon;
              return (
                <motion.button key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => setSelectedTopic(t)}
                  className="w-full text-left rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-cyan-400/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base mb-1 truncate">{t.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-2">{t.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                        <RIcon className="w-3 h-3" />
                        <span>{t.authorName}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${ROLE_COLORS[t.authorRole] || "bg-slate-100 text-slate-700"}`}>{t.authorRole}</span>
                        {t.weekNumber && <span>• Week {t.weekNumber}</span>}
                        <span>• {timeAgo(t.createdAt)}</span>
                      </div>
                    </div>
                    {t.postCount && t.postCount > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs font-bold shrink-0">
                        <MessageCircle className="w-3 h-3" /> {t.postCount}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )
      }

      <AnimatePresence>
        {showNewTopic && <NewTopicModal user={user} weekNumber={weekNumber} onClose={() => setShowNewTopic(false)} onCreated={() => setShowNewTopic(false)} />}
      </AnimatePresence>
    </div>
  );
}

function TopicView({ topic, user, onBack }: { topic: ForumTopic; user: any; onBack: () => void }) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToForumPosts(topic.id, (data) => { setPosts(data); setLoading(false); });
    return () => { unsub(); };
  }, [topic.id]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await addForumPost(topic.id, {
        content: reply.trim(),
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
      });
      setReply("");
      toast.success("Reply posted!");
    } finally { setSending(false); }
  }

  const RIcon = ROLE_ICONS[topic.authorRole] || UserIcon;
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="text-white/60 hover:text-white text-sm flex items-center gap-1 mb-4"><ChevronLeft className="w-4 h-4" /> Back to topics</button>
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 p-5 mb-4">
        <h2 className="text-xl font-bold mb-2">{topic.title}</h2>
        <p className="text-sm text-white/70 mb-3">{topic.content}</p>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <RIcon className="w-3 h-3" /><span>{topic.authorName}</span>
          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${ROLE_COLORS[topic.authorRole] || ""}`}>{topic.authorRole}</span>
          {topic.weekNumber && <span>• Week {topic.weekNumber}</span>}
          <span>• {timeAgo(topic.createdAt)}</span>
        </div>
      </div>

      <h3 className="font-bold mb-3 text-sm text-white/60">Replies ({posts.length})</h3>
      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div> :
        <div className="space-y-3 mb-4">
          {posts.map((p, i) => {
            const PIcon = ROLE_ICONS[p.authorRole] || UserIcon;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-2 mb-1.5 text-xs">
                  <PIcon className="w-3 h-3 text-white/40" />
                  <span className="font-bold text-white/80">{p.authorName}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${ROLE_COLORS[p.authorRole] || ""}`}>{p.authorRole}</span>
                  <span className="text-white/30">• {timeAgo(p.createdAt)}</span>
                </div>
                <p className="text-sm text-white/70">{p.content}</p>
              </motion.div>
            );
          })}
        </div>
      }

      <form onSubmit={sendReply} className="flex gap-2">
        <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply..." className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" />
        <button type="submit" disabled={sending || !reply.trim()} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

function NewTopicModal({ user, weekNumber, onClose, onCreated }: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const id = await createForumTopic({
        title: title.trim(), content: content.trim(),
        authorId: user.id, authorName: user.name, authorRole: user.role,
        weekNumber: weekNumber || null,
      });
      if (id) { toast.success("Topic created!"); onCreated(); } else toast.error("Failed to create topic");
    } finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-gradient-to-br from-[#1e1338] to-[#15102e] border border-white/15 rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-cyan-300" /> New Discussion Topic</h3>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-white/70 mb-1.5 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400" placeholder="e.g., Question about Article 21" required autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-white/70 mb-1.5 block">Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400 resize-none" placeholder="Write your question or discussion topic..." required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-sm hover:bg-white/15">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Topic"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
