"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, StickyNote, Save, Trash2, Loader2, BookOpen } from "lucide-react";
import { subscribeToNotes, saveNote, deleteNote, timeAgo, type StudentNote } from "@/lib/firestore";

// Inline note panel for the practice view (shown next to each question)
export function QuestionNotePanel({ user, questionId, questionText, weekNumber }: { user: any; questionId: string; questionText: string; weekNumber: number }) {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const unsub = subscribeToNotes(user.id, (data) => {
      setNotes(data);
      const existing = data.find(n => n.questionId === questionId);
      if (existing) { setNoteText(existing.note); setBookmarked(existing.bookmarked); }
      else { setNoteText(""); setBookmarked(false); }
      setLoading(false);
    });
    return () => { unsub(); };
  }, [user.id, questionId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveNote(user.id, questionId, { questionText, weekNumber, note: noteText, bookmarked });
      toast.success("Note saved!");
    } finally { setSaving(false); }
  }

  async function remove() {
    await deleteNote(user.id, questionId);
    setNoteText(""); setBookmarked(false);
    toast.success("Note deleted");
  }

  const bookmarkedCount = notes.filter(n => n.bookmarked).length;

  return (
    <div className="mt-3">
      <button onClick={() => setShowPanel(!showPanel)} className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1.5 transition">
        {showPanel ? <StickyNote className="w-3.5 h-3.5 text-amber-300" /> : <StickyNote className="w-3.5 h-3.5" />}
        {showPanel ? "Hide notes" : "Add note / bookmark"}
      </button>
      {showPanel && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 overflow-hidden">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <form onSubmit={save} className="space-y-2">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400 resize-none" placeholder="Write a note for this question..." />
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setBookmarked(!bookmarked)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${bookmarked ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" : "bg-white/5 text-white/50 border border-white/10"}`}>
                  {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <div className="flex gap-1.5">
                  {(noteText || bookmarked) && <button type="button" onClick={remove} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                  <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Bookmarks view (shown in a separate tab)
export function BookmarksView({ user }: { user: any }) {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToNotes(user.id, (data) => { setNotes(data); setLoading(false); });
    return () => { unsub(); };
  }, [user.id]);

  const bookmarked = notes.filter(n => n.bookmarked);
  const notesOnly = notes.filter(n => n.note && !n.bookmarked);

  return (
    <div>
      <h2 className="text-2xl font-black mb-1 flex items-center gap-2"><Bookmark className="w-6 h-6 text-amber-300" /> My Notes & Bookmarks</h2>
      <p className="text-white/60 text-sm mb-6">Your saved notes and bookmarked questions, synced in real-time across devices.</p>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div> :
        notes.length === 0 ? (
          <div className="text-center py-16 text-white/40"><StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notes or bookmarks yet.</p><p className="text-xs mt-1">Click "Add note / bookmark" on any practice question to save it here.</p></div>
        ) : (
          <div className="space-y-6">
            {bookmarked.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><BookmarkCheck className="w-4 h-4 text-amber-300" /> Bookmarked ({bookmarked.length})</h3>
                <div className="space-y-2">
                  {bookmarked.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl bg-amber-500/5 border border-amber-400/20 p-3">
                      <div className="text-xs text-amber-300 mb-1">Week {n.weekNumber} • {timeAgo(n.createdAt)}</div>
                      <p className="text-sm text-white/80 line-clamp-2">{n.questionText}</p>
                      {n.note && <p className="text-xs text-white/50 mt-1.5 italic">📝 {n.note}</p>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {notesOnly.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><StickyNote className="w-4 h-4 text-cyan-300" /> Notes ({notesOnly.length})</h3>
                <div className="space-y-2">
                  {notesOnly.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="text-xs text-cyan-300 mb-1">Week {n.weekNumber} • {timeAgo(n.createdAt)}</div>
                      <p className="text-sm text-white/60 line-clamp-1 mb-1">{n.questionText}</p>
                      <p className="text-sm text-white/80">📝 {n.note}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}
