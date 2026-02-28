import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClipboardList, Star, MessageSquare, ListChecks, ThumbsUp,
  CheckCircle2, Loader2, ChevronRight, Calendar, Lock,
  ArrowLeft, Send, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const TYPE_LABELS = {
  rating: "Star Rating",
  text: "Written Response",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
};

const TYPE_COLORS = {
  rating: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-400" },
  text: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", dot: "bg-sky-400" },
  multiple_choice: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", dot: "bg-violet-400" },
  yes_no: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-400" },
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500">
            {current} of {total} answered
          </span>
          <span className="text-xs font-bold text-[#1e4db7]">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1e4db7] to-[#4f7ef8] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const active = hovered || value;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="group relative focus:outline-none"
          >
            <Star
              className={`w-10 h-10 transition-all duration-150 ${
                n <= active
                  ? "text-amber-400 fill-amber-400 scale-110 drop-shadow-sm"
                  : "text-slate-200 fill-slate-200 group-hover:text-amber-200 group-hover:fill-amber-200"
              }`}
            />
          </button>
        ))}
        {active > 0 && (
          <span className="ml-3 text-sm font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            {labels[active]}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <div key={n} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${n <= active ? "bg-amber-400" : "bg-slate-100"}`} />
        ))}
      </div>
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, answer, onAnswer, isAnswered, showError }) {
  const colors = TYPE_COLORS[question.question_type] || TYPE_COLORS.text;

  return (
    <div className={`relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
      isAnswered
        ? "border-[#1e4db7]/20 shadow-sm"
        : showError && question.is_required
        ? "border-red-300 shadow-sm shadow-red-100"
        : "border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md"
    }`}>

      {/* Answered indicator strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isAnswered ? "bg-[#1e4db7]" : showError && question.is_required ? "bg-red-400" : "bg-slate-100"}`} />

      <div className="p-6 pl-7">
        {/* Question header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#0f2d5e] text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-800 text-[15px] leading-snug">
                {question.question_text}
                {question.is_required && <span className="text-red-400 ml-1 font-bold">*</span>}
              </p>
              {isAnswered && (
                <CheckCircle2 className="w-5 h-5 text-[#1e4db7] shrink-0 mt-0.5" />
              )}
            </div>
            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {TYPE_LABELS[question.question_type]}
            </div>
          </div>
        </div>

        {/* Answer inputs */}
        <div className="ml-12">

          {/* ── STAR RATING ── */}
          {question.question_type === "rating" && (
            <StarRating value={answer ?? 0} onChange={(v) => onAnswer(question.id, v)} />
          )}

          {/* ── TEXT ── */}
          {question.question_type === "text" && (
            <Textarea
              value={answer ?? ""}
              onChange={(e) => onAnswer(question.id, e.target.value)}
              placeholder="Share your thoughts here…"
              rows={4}
              className="resize-none text-sm border-slate-200 focus:border-[#1e4db7] focus:ring-[#1e4db7]/10 rounded-xl bg-slate-50/50 placeholder:text-slate-300 transition-colors"
            />
          )}

          {/* ── MULTIPLE CHOICE ── */}
          {question.question_type === "multiple_choice" && (
            <div className="grid gap-2">
              {(question.options || []).map((opt, oi) => {
                const selected = answer === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onAnswer(question.id, opt.id)}
                    className={`group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 text-sm text-left font-medium transition-all duration-150 ${
                      selected
                        ? "border-[#1e4db7] bg-[#1e4db7]/5 text-[#0f2d5e]"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-[#1e4db7]/30 hover:bg-[#1e4db7]/3"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      selected ? "border-[#1e4db7] bg-[#1e4db7]" : "border-slate-300 group-hover:border-[#1e4db7]/50"
                    }`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="flex-1">{opt.option_text}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#1e4db7] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── YES / NO ── */}
          {question.question_type === "yes_no" && (
            <div className="flex gap-3">
              {[
                { label: "Yes", value: true,  active: "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100", icon: "✓" },
                { label: "No",  value: false, active: "bg-red-500 border-red-500 text-white shadow-md shadow-red-100", icon: "✗" },
              ].map(({ label, value, active: activeCls, icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onAnswer(question.id, value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all duration-150 ${
                    answer === value
                      ? activeCls
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                    answer === value ? "border-white/40 bg-white/20" : "border-slate-200"
                  }`}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Required error */}
          {showError && question.is_required && !isAnswered && (
            <p className="flex items-center gap-1.5 mt-2 text-xs text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> This question is required
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onBack }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Thank you!</h2>
      <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
        Your evaluation has been submitted successfully. Your feedback helps us improve future events.
      </p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#1e4db7] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Evaluations
      </button>
    </div>
  );
}

// ── Answer Form ───────────────────────────────────────────────────────────────
function EvaluationAnswerForm({ evaluation, onSubmitted, onBack }) {
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const questions = evaluation.questions || [];
  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && a !== "" && a !== null;
  }).length;

  const setAnswer = (qId, val) => setAnswers((p) => ({ ...p, [qId]: val }));

  const handleSubmit = async () => {
    const missing = questions.filter(
      (q) => q.is_required && (answers[q.id] === undefined || answers[q.id] === "" || answers[q.id] === null)
    );
    if (missing.length) {
      setShowErrors(true);
      toast.error(`${missing.length} required question${missing.length > 1 ? "s" : ""} need${missing.length === 1 ? "s" : ""} an answer.`);
      // Scroll to first unanswered
      const el = document.getElementById(`q-${missing[0].id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => {
        const ans  = answers[q.id];
        const base = { question_id: q.id };
        if (q.question_type === "rating")          return { ...base, rating_value: ans ?? null };
        if (q.question_type === "text")            return { ...base, text_value: ans ?? null };
        if (q.question_type === "multiple_choice") return { ...base, option_id: ans ?? null };
        if (q.question_type === "yes_no")          return { ...base, yes_no_value: ans ?? null };
        return base;
      });
      await axios.post(`/api/evaluations/${evaluation.id}/responses`, { answers: payload }, authH());
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      console.error("Submit error:", err.response?.data);
      toast.error(err.response?.data?.message ?? "Failed to submit.", {
        description: err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" | ")
          : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessScreen onBack={onBack} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress */}
      <ProgressBar current={answeredCount} total={questions.length} />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Evaluations
        </button>

        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl mb-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f45] via-[#0f2d5e] to-[#1e4db7]" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #4f7ef8 0%, transparent 60%), radial-gradient(circle at 20% 80%, #0f2d5e 0%, transparent 60%)" }}
          />
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">
                  {evaluation.event?.title ?? "Event Evaluation"}
                </p>
                <h1 className="text-xl font-extrabold text-white leading-tight mb-1">
                  {evaluation.title}
                </h1>
                {evaluation.description && (
                  <p className="text-blue-200/80 text-sm leading-relaxed mt-1">
                    {evaluation.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <span className="text-white text-xs font-medium">{questions.length} questions</span>
                  </div>
                  {evaluation.is_anonymous && (
                    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                      <span className="text-white text-xs font-medium">Anonymous</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <Calendar className="w-3 h-3 text-blue-300" />
                    <span className="text-white text-xs font-medium">{answeredCount}/{questions.length} answered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => {
            const ans = answers[q.id];
            const isAnswered = ans !== undefined && ans !== "" && ans !== null;
            return (
              <div key={q.id} id={`q-${q.id}`}>
                <QuestionCard
                  question={q}
                  index={i}
                  answer={ans}
                  onAnswer={setAnswer}
                  isAnswered={isAnswered}
                  showError={showErrors}
                />
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-600">{answeredCount}</span> of {questions.length} questions answered
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:from-[#0a1f45] hover:to-[#1840a0] text-white px-8 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><Send className="w-4 h-4" /> Submit Evaluation</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Evaluation Card ───────────────────────────────────────────────────────────
function EvaluationCard({ evaluation, onAnswer }) {
  const isOpen      = evaluation.status === "open";
  const hasAnswered = evaluation.has_responded;
  const clickable   = isOpen && !hasAnswered;

  return (
    <div
      onClick={() => clickable && onAnswer(evaluation)}
      className={`group relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
        clickable
          ? "border-slate-100 hover:border-[#1e4db7]/30 hover:shadow-lg hover:shadow-blue-50 cursor-pointer"
          : "border-slate-100 opacity-60"
      }`}
    >
      {/* Left accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        hasAnswered ? "bg-emerald-400" : isOpen ? "bg-[#1e4db7]" : "bg-slate-200"
      }`} />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            hasAnswered ? "bg-emerald-50" : isOpen ? "bg-blue-50" : "bg-slate-100"
          }`}>
            {hasAnswered
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : isOpen
              ? <ClipboardList className="w-5 h-5 text-[#1e4db7]" />
              : <Lock className="w-5 h-5 text-slate-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">
                  {evaluation.title}
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">{evaluation.event?.title ?? "Event"}</span>
                </p>
              </div>
              <div className="shrink-0">
                {hasAnswered
                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  : isOpen
                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e4db7] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e4db7] animate-pulse" />
                      Open
                    </span>
                  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                      Closed
                    </span>
                }
              </div>
            </div>

            {evaluation.description && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-1">{evaluation.description}</p>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400 font-medium">
                {evaluation.questions_count ?? 0} question{evaluation.questions_count !== 1 ? "s" : ""}
              </span>
              {clickable && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#1e4db7] group-hover:gap-2 transition-all">
                  Start now <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ label, count, pulse }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="text-[11px] font-bold text-slate-300">({count})</span>
      <div className="flex-1 h-px bg-slate-100" />
      {pulse && <div className="w-2 h-2 rounded-full bg-[#1e4db7] animate-pulse" />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);

  const fetchEvaluations = () => {
    setLoading(true);
    axios
      .get("/api/student/evaluations", authH())
      .then((r) => setEvaluations(r.data.evaluations ?? r.data))
      .catch(() => toast.error("Failed to load evaluations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvaluations(); }, []);

  const handleAnswer = async (evaluation) => {
    setLoadingEval(true);
    try {
      const res = await axios.get(`/api/evaluations/${evaluation.id}`, authH());
      setSelected(res.data);
    } catch {
      toast.error("Failed to load evaluation.");
    } finally {
      setLoadingEval(false);
    }
  };

  // Loading evaluation
  if (loadingEval) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading evaluation…</p>
        </div>
      </div>
    );
  }

  // Answer form
  if (selected) {
    return (
      <EvaluationAnswerForm
        evaluation={selected}
        onSubmitted={() => { setSelected(null); fetchEvaluations(); }}
        onBack={() => setSelected(null)}
      />
    );
  }

  const pending   = evaluations.filter((e) => e.status === "open" && !e.has_responded);
  const completed = evaluations.filter((e) => e.has_responded);
  const closed    = evaluations.filter((e) => e.status === "closed" && !e.has_responded);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-md shadow-blue-900/20">
              <ClipboardList className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Evaluations</h1>
          </div>
          <p className="text-sm text-slate-400 ml-12">Rate and give feedback on events you attended.</p>
        </div>

        {/* Stats row */}
        {!loading && evaluations.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Pending", count: pending.length, color: "text-[#1e4db7]", bg: "bg-blue-50", border: "border-blue-100" },
              { label: "Completed", count: completed.length, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Closed", count: closed.length, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100" },
            ].map(({ label, count, color, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-2xl p-3 text-center`}>
                <p className={`text-xl font-extrabold ${color}`}>{count}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
            </div>
            <p className="text-sm text-slate-400">Loading evaluations…</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 mb-1">No evaluations yet</p>
            <p className="text-sm text-slate-400">Check back after attending events.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 && (
              <div>
                <SectionLabel label="Pending" count={pending.length} pulse />
                <div className="space-y-3">
                  {pending.map((ev) => <EvaluationCard key={ev.id} evaluation={ev} onAnswer={handleAnswer} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <SectionLabel label="Completed" count={completed.length} />
                <div className="space-y-3">
                  {completed.map((ev) => <EvaluationCard key={ev.id} evaluation={ev} onAnswer={handleAnswer} />)}
                </div>
              </div>
            )}
            {closed.length > 0 && (
              <div>
                <SectionLabel label="Closed" count={closed.length} />
                <div className="space-y-3">
                  {closed.map((ev) => <EvaluationCard key={ev.id} evaluation={ev} onAnswer={handleAnswer} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}