"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Megaphone, Plus, Loader2, Trash2, X, Shield, User as UserIcon } from "lucide-react";
import { subscribeToAnnouncements, createAnnouncement, deleteAnnouncement, timeAgo, type Announcement } from "@/lib/firestore";

export function AnnouncementsDisplay({ collegeId }: { collegeId: string | null }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAnnouncements(collegeId, (data) => { setAnnouncements(data); setLoading(false); });
    return () => { unsub(); };
  }, [collegeId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>;
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {announcements.slice(0, 5).map((a, i) => (
        <motion.div key={a.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className={`rounded-2xl p-4 border ${a.targetCollegeId ? "bg-blue-500/10 border-blue-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.targetCollegeId ? "bg-blue-500/20" : "bg-amber-500/20"}`}>
              <Megaphone className={`w-4 h-4 ${a.targetCollegeId ? "text-blue-300" : "text-amber-300"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm">{a.title}</h4>
                {a.targetCollegeId && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase">{a.targetCollegeName}</span>}
              </div>
              <p className="text-xs text-white/70 mt-1">{a.content}</p>
              <div className="text-[10px] text-white/40 mt-1.5">By {a.authorName} • {a.authorRole} • {timeAgo(a.createdAt)}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function AnnouncementsManager({ user, collegeId }: { user: any; collegeId: string | null }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAnnouncements(collegeId, (data) => { setAnnouncements(data); setLoading(false); });
    return () => { unsub(); };
  }, [collegeId]);

  async function del(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    toast.success("Deleted");
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-500" /> Announcements</h3>
        <button onClick={() => setShowNew(true)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div> :
        announcements.length === 0 ? <div className="text-sm text-slate-400 py-6 text-center">No announcements yet.</div> :
        <div className="space-y-2 max-h-80 overflow-y-auto cq-scroll">
          {announcements.map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm">{a.title}</div>
                  <p className="text-xs text-slate-600 mt-0.5">{a.content}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    By {a.authorName} • {a.authorRole} • {timeAgo(a.createdAt)}
                    {a.targetCollegeName && <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">→ {a.targetCollegeName}</span>}
                  </div>
                </div>
                <button onClick={() => del(a.id)} className="p-1 rounded hover:bg-red-50 text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      }

      <AnimatePresence>
        {showNew && <NewAnnouncementModal user={user} collegeId={collegeId} onClose={() => setShowNew(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NewAnnouncementModal({ user, collegeId, onClose }: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetCollege, setTargetCollege] = useState(false); // false = global, true = this college
  const [loading, setLoading] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const id = await createAnnouncement({
        title: title.trim(), content: content.trim(),
        authorId: user.id, authorName: user.name, authorRole: user.role,
        targetCollegeId: targetCollege ? collegeId : null,
        targetCollegeName: targetCollege ? user.college?.name : null,
      });
      if (id) { toast.success("Announcement posted!"); onClose(); } else toast.error("Failed to post");
    } finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-bold flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-500" /> New Announcement</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={create} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Announcement title" required autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" placeholder="Write your announcement..." required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="target-college" checked={targetCollege} onChange={e => setTargetCollege(e.target.checked)} className="rounded" />
            <label htmlFor="target-college" className="text-xs font-bold text-slate-600">
              {targetCollege ? `Send to ${user.college?.name} only` : "Send to ALL colleges (global)"}
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Post"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
