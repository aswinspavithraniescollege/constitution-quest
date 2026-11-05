"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Loader2, Target, Clock, ChevronLeft, CheckCircle2, XCircle,
  AlertTriangle, Lightbulb, Send, Trophy, RotateCcw, Home as HomeIcon, Eye
} from "lucide-react";

type Mode = "list" | "play" | "result";

export function MockTestPlayer({ user, onExit }: { user: any; onExit: () => void }) {
  const [mode, setMode] = useState<Mode>("list");
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMock, setSelectedMock] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const isTestMode = user.role !== "STUDENT";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/student/mock-tests");
        const data = await res.json();
        setMockTests(data.mockTests || []);
      } finally { setLoading(false); }
    })();
  }, []);

  if (mode === "play" && selectedMock) {
    return (
      <MockPlay
        mockTest={selectedMock}
        isTestMode={isTestMode}
        onComplete={(r) => { setResult(r); setMode("result"); }}
        onExit={() => { setMode("list"); setSelectedMock(null); }}
      />
    );
  }

  if (mode === "result" && result) {
    return (
      <MockResult
        result={result}
        isTestMode={isTestMode}
        onRetry={() => { setResult(null); setMode("list"); setSelectedMock(null); }}
        onExit={onExit}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-500" /> Mock Tests
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isTestMode
              ? "Test mode — take any mock test to preview questions and see answers. No XP or stats are tracked."
              : "Take a mock test to earn XP and test your knowledge."}
          </p>
        </div>
        <button onClick={onExit} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {isTestMode && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 flex items-center gap-2">
          <Eye className="w-4 h-4 shrink-0" />
          <span><strong>Test Mode:</strong> You're logged in as <strong>{user.role}</strong>. Your scores won't be saved or affect any stats.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : mockTests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No mock tests available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTests.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { setSelectedMock(m); setMode("play"); }}
              className="text-left rounded-2xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/[0.05] border border-amber-400/30 hover:border-amber-400/60 hover:bg-amber-500/15 transition-all cq-card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${m.weekNumber === null ? "bg-gradient-to-br from-yellow-500 to-amber-600" : "bg-gradient-to-br from-amber-500 to-orange-500"}`}>
                    {m.weekNumber === null ? "🏆" : "🎯"}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-amber-600 font-bold">
                      {m.weekNumber === null ? "Grand Final" : `Week ${m.weekNumber}`}
                    </div>
                    <div className="font-bold text-base text-slate-900">{m.title}</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">{m.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-3 text-slate-500">
                  <span>📝 {m.numQuestions} Qs</span>
                  <span>⏱ {m.durationMin} min</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs">Take Test →</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function MockPlay({ mockTest, isTestMode, onComplete, onExit }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mockTest.durationMin * 60);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/mock-test?mockTestId=${mockTest.id}`);
        const data = await res.json();
        setQuestions(data.questions || []);
      } finally { setLoading(false); }
    })();
  }, [mockTest.id]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const timeTakenSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await fetch("/api/mock-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockTestId: mockTest.id, answers, timeTakenSec }),
      });
      const data = await res.json();
      onComplete(data);
    } finally { setSubmitting(false); }
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeColor = timeLeft < 60 ? "text-red-500" : timeLeft < 180 ? "text-amber-500" : "text-slate-700";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 mb-4">
        <div className={`rounded-2xl p-4 flex items-center justify-between ${isTestMode ? "bg-blue-50 border border-blue-300" : "bg-white border border-amber-300"}`}>
          <div>
            <div className={`text-xs font-bold uppercase tracking-wider ${isTestMode ? "text-blue-600" : "text-amber-600"}`}>{mockTest.title}</div>
            <div className="text-xs text-slate-500">Answered: {answeredCount}/{questions.length}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black ${timeColor} flex items-center gap-1`}>
              <Clock className="w-5 h-5" />
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <button onClick={handleSubmit} disabled={submitting} className={`px-4 py-2 rounded-xl text-white font-bold text-sm ${isTestMode ? "bg-blue-500" : "bg-gradient-to-r from-amber-500 to-orange-500"} disabled:opacity-50`}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {isTestMode && (
        <div className="mb-4 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-600 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> Test Mode — No XP or stats tracked
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const sel = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${sel ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>{i + 1}</div>
                <p className="text-sm sm:text-base font-medium pt-1 text-slate-800">{q.questionText}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                {[
                  { k: "A", t: q.optionA }, { k: "B", t: q.optionB },
                  { k: "C", t: q.optionC }, { k: "D", t: q.optionD },
                ].map(opt => (
                  <button
                    key={opt.k}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.k }))}
                    className={`text-left p-3 rounded-xl border text-sm transition flex items-center gap-2 ${
                      sel === opt.k ? "bg-amber-500/20 border-amber-400 text-slate-900" : "bg-slate-50 border-slate-200 hover:border-amber-400/40"
                    }`}
                  >
                    <span className="font-bold w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-xs">{opt.k}</span>
                    <span className="flex-1 text-slate-700">{opt.t}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final submit */}
      <div className="mt-6 sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 py-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {allAnswered ? "✅ All answered!" : `${questions.length - answeredCount} unanswered`}
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-2 disabled:opacity-50">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>🏁 Submit Test</>}
        </button>
      </div>
    </div>
  );
}

function MockResult({ result, isTestMode, onRetry, onExit }: any) {
  const { score, total, percent, detail, isTestMode: serverTestMode } = result;

  useEffect(() => {
    if (percent >= 80) confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    else if (percent >= 50) confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }, [percent]);

  const emoji = percent >= 90 ? "🏆" : percent >= 75 ? "🥇" : percent >= 50 ? "🥈" : percent >= 30 ? "🥉" : "💪";
  const title = isTestMode ? "Test Complete!" : percent >= 90 ? "Champion!" : percent >= 75 ? "Excellent!" : percent >= 50 ? "Good Job!" : "Keep Practicing!";
  const color = percent >= 75 ? "from-emerald-500 to-green-500" : percent >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-pink-500";

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl bg-white border border-slate-200 p-8 text-center mb-6 shadow-lg">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.2 }} className="text-7xl mb-3">{emoji}</motion.div>
        <h2 className={`text-4xl font-black mb-2 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{title}</h2>
        <div className="text-2xl font-bold mb-1 text-slate-700">{score} / {total}</div>
        <div className="text-3xl font-black mb-4 text-slate-800">{percent}%</div>
        {isTestMode && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-bold text-sm">
            <Eye className="w-4 h-4" /> Test Mode — Score not saved
          </div>
        )}
        {!isTestMode && result.xpAwarded > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-bold text-sm">
            ⚡ +{result.xpAwarded} XP earned
          </div>
        )}
      </motion.div>

      {/* Detailed review */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700"><RotateCcw className="w-4 h-4" /> Detailed Review</h3>
        {detail.map((d: any, i: number) => (
          <div key={d.questionId} className={`rounded-2xl p-4 border ${d.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-start gap-2 mb-3">
              <span className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${d.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>{i + 1}</span>
              <p className="text-sm font-medium flex-1 text-slate-700">{d.questionText}</p>
              {d.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-8 mb-2 text-xs">
              {[
                { k: "A", t: d.optionA }, { k: "B", t: d.optionB },
                { k: "C", t: d.optionC }, { k: "D", t: d.optionD },
              ].map(opt => {
                const correct = opt.k === d.correctOption;
                const chosen = opt.k === d.selectedOption;
                return (
                  <div key={opt.k} className={`flex items-center gap-2 p-2 rounded ${correct ? "bg-emerald-100" : chosen ? "bg-red-100" : "bg-slate-100"}`}>
                    <span className="font-bold w-4 text-slate-600">{opt.k}</span>
                    <span className="flex-1 text-slate-600">{opt.t}</span>
                    {correct && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {chosen && !correct && <XCircle className="w-3 h-3 text-red-500" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 ml-8"><span className="font-bold text-amber-600">Explanation:</span> {d.explanation}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition">
          Back to Tests
        </button>
        <button onClick={onExit} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-[1.02] transition">
          Done
        </button>
      </div>
    </div>
  );
}
