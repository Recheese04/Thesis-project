import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus, Trash2, Loader2, CheckCircle2, X, Star,
  ClipboardList, BarChart3, MessageSquare, ListChecks, ThumbsUp,
  ToggleLeft, ToggleRight, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  PencilLine, ArrowLeft, Search, Calendar, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const TYPE_ICONS  = { rating: Star, text: MessageSquare, multiple_choice: ListChecks, yes_no: ThumbsUp };
const TYPE_LABELS = { rating: "Rating (1–5)", text: "Open Text", multiple_choice: "Multiple Choice", yes_no: "Yes / No" };
const TYPE_COLORS = {
  rating:          { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200",  dot: "bg-amber-400"  },
  text:            { bg: "bg-sky-50",    text: "text-sky-600",    border: "border-sky-200",    dot: "bg-sky-400"    },
  multiple_choice: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", dot: "bg-violet-400" },
  yes_no:          { bg: "bg-emerald-50",text: "text-emerald-600",border: "border-emerald-200",dot: "bg-emerald-400"},
};
const EMPTY_Q = { question_text: "", question_type: "rating", is_required: true, order_index: 0, options: [] };

// ── AI Summary Box ────────────────────────────────────────────────────────────
function AISummaryBox({ question, responses }) {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleSummarize = async () => {
    if (!responses.length) { toast.error("No text responses to summarize."); return; }
    setLoading(true); setSummary(null);
    try {
      const res  = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ inputs: `Question: "${question}". Responses: ${responses.map((r, i) => `(${i + 1}) ${r}`).join(" ")}` }),
      });
      const data = await res.json();
      if (data?.error) { toast.error(typeof data.error === "string" && data.error.includes("loading") ? "Model loading, try again in ~20s." : `API error: ${data.error}`); return; }
      let text = "";
      if (Array.isArray(data))           text = data[0]?.summary_text || data[0]?.generated_text || "";
      else if (typeof data === "object") text = data.summary_text || data.generated_text || data.result || data.summary || "";
      else if (typeof data === "string") text = data;
      if (!text.trim()) throw new Error("Unexpected response shape.");
      setSummary(text.trim()); setExpanded(true);
    } catch (err) { toast.error("Failed to generate summary.", { description: err.message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-violet-700">AI Summary</span>
          {responses.length > 0 && (
            <span className="text-[10px] font-semibold text-violet-400 bg-violet-100 px-2 py-0.5 rounded-full">
              {responses.length} response{responses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {summary && (
            <button onClick={() => setExpanded((v) => !v)} className="text-violet-400 hover:text-violet-600 transition-colors p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={handleSummarize}
            disabled={loading || !responses.length}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              loading || !responses.length
                ? "bg-violet-100 text-violet-300 cursor-not-allowed"
                : "bg-violet-500 text-white hover:bg-violet-600 shadow-sm"
            }`}
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" />Summarizing…</>
              : <><Sparkles className="w-3 h-3" />{summary ? "Re-summarize" : "Summarize"}</>}
          </button>
        </div>
      </div>
      {summary && expanded && (
        <div className="px-4 pb-4">
          <div className="bg-white border border-violet-100 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}
      {!summary && !loading && (
        <div className="px-4 pb-3">
          <p className="text-xs text-violet-400 italic">
            {!responses.length ? "No text responses yet." : "Click 'Summarize' to generate an AI summary of all responses."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Question Builder Card ─────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onRemove }) {
  const TypeIcon = TYPE_ICONS[question.question_type] || Star;
  const colors   = TYPE_COLORS[question.question_type] || TYPE_COLORS.text;
  const setField  = (f, v) => onChange(index, { ...question, [f]: v });
  const addOption = () => setField("options", [...(question.options || []), { option_text: "", order_index: (question.options || []).length }]);
  const updOpt    = (i, t) => { const o = [...(question.options || [])]; o[i] = { ...o[i], option_text: t }; setField("options", o); };
  const remOpt    = (i)    => setField("options", (question.options || []).filter((_, idx) => idx !== i));

  return (
    <div className="relative bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7c3aed]" />
      <div className="p-4 pl-5 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#7c3aed] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
              {index + 1}
            </span>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {TYPE_LABELS[question.question_type]}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setField("is_required", !question.is_required)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                question.is_required
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {question.is_required ? "Required" : "Optional"}
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Question text input */}
        <Input
          value={question.question_text}
          onChange={(e) => setField("question_text", e.target.value)}
          placeholder="Enter your question…"
          className="border-slate-200 bg-slate-50 h-9 text-sm focus:bg-white transition-colors"
          required
        />

        {/* Type selector */}
        <Select value={question.question_type} onValueChange={(v) => setField("question_type", v)}>
          <SelectTrigger className="border-slate-200 bg-slate-50 h-9 text-sm w-52 focus:bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {Object.entries(TYPE_LABELS).map(([val, label]) => {
              const Icon = TYPE_ICONS[val];
              const c    = TYPE_COLORS[val];
              return (
                <SelectItem key={val} value={val}>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${c.bg}`}>
                      <Icon className={`w-3 h-3 ${c.text}`} />
                    </div>
                    <span>{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Type-specific previews */}
        {question.question_type === "multiple_choice" && (
          <div className="space-y-2 pt-1">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                <Input
                  value={opt.option_text}
                  onChange={(e) => updOpt(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="border-slate-200 bg-slate-50 h-8 text-sm"
                />
                <button type="button" onClick={() => remOpt(i)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1.5 text-xs text-[#7c3aed] font-semibold hover:underline mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
          </div>
        )}
        {question.question_type === "rating" && (
          <div className="flex items-center gap-1 pt-1">
            {[1,2,3,4,5].map((n) => <Star key={n} className="w-5 h-5 text-amber-200 fill-amber-200" />)}
            <span className="text-xs text-slate-400 ml-2 font-medium">1–5 scale</span>
          </div>
        )}
        {question.question_type === "yes_no" && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Yes</span>
            <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">No</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Results View ──────────────────────────────────────────────────────────────
function ResultsView({ evaluationId, onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/evaluations/${evaluationId}/results`, authH())
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load results."))
      .finally(() => setLoading(false));
  }, [evaluationId]);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 font-medium mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Evaluation
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-md">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Results</h2>
          <p className="text-sm text-slate-400">Summary of all student responses</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7c3aed] mx-auto mb-2" />
          <span className="text-sm text-slate-400">Loading results…</span>
        </div>
      ) : !data ? (
        <div className="py-16 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No results available.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#7c3aed]/5 to-[#7c3aed]/10 border border-[#7c3aed]/10 rounded-2xl p-4 text-center">
              <p className="text-3xl font-extrabold text-[#7c3aed]">{data.total_responses}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Total Responses</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 text-center">
              <p className="text-3xl font-extrabold text-violet-700">{data.results?.length}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Questions</p>
            </div>
          </div>

          {/* Result cards */}
          {(data.results || []).map((r, i) => {
            const TypeIcon = TYPE_ICONS[r.question_type] || Star;
            const colors   = TYPE_COLORS[r.question_type] || TYPE_COLORS.text;
            return (
              <div key={r.question_id} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="absolute" />
                {/* Card header */}
                <div className="p-4 border-b border-slate-50">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-[#7c3aed] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{r.question_text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {TYPE_LABELS[r.question_type]}
                        </div>
                        <span className="text-xs text-slate-400">{r.total_answers} answer{r.total_answers !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {r.question_type === "rating" && r.average_rating != null && (
                    <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={`w-6 h-6 transition-colors ${n <= Math.round(r.average_rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
                        ))}
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-amber-600">{r.average_rating}</span>
                        <span className="text-sm text-slate-400 ml-1">/ 5.00</span>
                      </div>
                      <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                          style={{ width: `${(r.average_rating / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {r.question_type === "yes_no" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-emerald-600">{r.yes_count}</p>
                        <p className="text-xs text-emerald-500 font-semibold mt-0.5">Yes</p>
                        {(r.yes_count + r.no_count) > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {Math.round((r.yes_count / (r.yes_count + r.no_count)) * 100)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-red-500">{r.no_count}</p>
                        <p className="text-xs text-red-400 font-semibold mt-0.5">No</p>
                        {(r.yes_count + r.no_count) > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {Math.round((r.no_count / (r.yes_count + r.no_count)) * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {r.question_type === "multiple_choice" && (
                    <div className="space-y-3">
                      {(r.option_counts || []).map((opt) => {
                        const pct = r.total_answers > 0 ? Math.round((opt.count / r.total_answers) * 100) : 0;
                        return (
                          <div key={opt.option_id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 font-medium">{opt.option_text}</span>
                              <span className="font-semibold text-[#7c3aed]">{opt.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {r.question_type === "text" && (
                    <div className="space-y-2">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {r.text_responses?.length
                          ? r.text_responses.map((t, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 leading-relaxed">
                                <span className="text-[10px] font-bold text-slate-300 mr-2">#{idx + 1}</span>
                                {t}
                              </div>
                            ))
                          : <p className="text-xs text-slate-400 italic text-center py-4">No text responses yet.</p>}
                      </div>
                      <AISummaryBox question={r.question_text} responses={r.text_responses ?? []} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Manage Single Evaluation ──────────────────────────────────────────────────
function ManageEvaluation({ event, onBack }) {
  const [evaluation, setEval]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState("manage");
  const [toggling, setToggling] = useState(false);

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions]     = useState([{ ...EMPTY_Q }]);
  const [saving, setSaving]           = useState(false);

  const [addQuestions, setAddQuestions] = useState([{ ...EMPTY_Q }]);
  const [addSaving, setAddSaving]       = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/events/${event.id}/evaluation`, authH())
      .then((r) => setEval(r.data.evaluation))
      .catch(() => setEval(null))
      .finally(() => setLoading(false));
  }, [event.id]);

  const handleCreate = async () => {
    if (questions.some((q) => !q.question_text.trim())) { toast.error("All questions must have text."); return; }
    setSaving(true);
    try {
      const res = await axios.post("/api/evaluations", {
        event_id: event.id, title: title || "Event Evaluation",
        description, is_anonymous: isAnonymous,
        questions: questions.map((q, i) => ({ ...q, order_index: i })),
      }, authH());
      toast.success("Evaluation created!");
      setEval(res.data.evaluation);
      setView("manage");
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error("Error", { description: errs ? Object.values(errs).flat().join("\n") : err.response?.data?.message ?? "An error occurred." });
    } finally { setSaving(false); }
  };

  const handleAddQuestions = async () => {
    if (addQuestions.some((q) => !q.question_text.trim())) { toast.error("All questions must have text."); return; }
    setAddSaving(true);
    try {
      const existingCount = (evaluation.questions || []).length;
      const res = await axios.post(`/api/evaluations/${evaluation.id}/questions`, {
        questions: addQuestions.map((q, i) => ({ ...q, order_index: existingCount + i })),
      }, authH());
      toast.success("Questions added!");
      setEval(res.data.evaluation ?? evaluation);
      setAddQuestions([{ ...EMPTY_Q }]);
      setView("manage");
      axios.get(`/api/events/${event.id}/evaluation`, authH()).then((r) => setEval(r.data.evaluation)).catch(() => {});
    } catch (err) {
      toast.error("Error", { description: err.response?.data?.message ?? "An error occurred." });
    } finally { setAddSaving(false); }
  };

  const handleToggle = async () => {
    if (!evaluation) return;
    setToggling(true);
    const newStatus = evaluation.status === "open" ? "closed" : "open";
    try {
      await axios.put(`/api/evaluations/${evaluation.id}`, { status: newStatus }, authH());
      setEval((p) => ({ ...p, status: newStatus }));
      toast.success(`Evaluation ${newStatus === "open" ? "opened" : "closed"}.`);
    } catch { toast.error("Failed to update status."); }
    finally { setToggling(false); }
  };

  const updQ = (arr, setArr) => (i, updated) => setArr((p) => p.map((q, idx) => idx === i ? updated : q));
  const remQ = (arr, setArr) => (i)          => setArr((p) => p.filter((_, idx) => idx !== i));
  const addQ = (setArr)      => ()           => setArr((p) => [...p, { ...EMPTY_Q, order_index: p.length }]);

  if (view === "results") return <ResultsView evaluationId={evaluation.id} onBack={() => setView("manage")} />;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 font-medium mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Events
      </button>

      {/* Event banner */}
      <div className="relative overflow-hidden rounded-2xl mb-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#7c3aed]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #c4b5fd 0%, transparent 60%)" }} />
        <div className="relative p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-0.5">Managing Evaluation For</p>
            <h2 className="text-lg font-extrabold text-white leading-tight">{event.title}</h2>
            {event.event_date && <p className="text-violet-300 text-xs mt-0.5">{event.event_date}</p>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7c3aed] mx-auto mb-2" />
          <span className="text-sm text-slate-400">Loading…</span>
        </div>
      ) : (
        <>
          {/* ── MANAGE VIEW ── */}
          {view === "manage" && (
            <div className="space-y-5">
              {evaluation ? (
                <>
                  {/* Tab bar */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {[
                      { id: "manage",  label: "Overview" },
                      { id: "add",     label: "+ Questions" },
                      { id: "results", label: "Results" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setView(t.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          view === t.id
                            ? "bg-white text-[#7c3aed] shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Info card */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{evaluation.title}</p>
                        {evaluation.description && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{evaluation.description}</p>}
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${
                        evaluation.status === "open"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {evaluation.status === "open" ? "● Open" : "○ Closed"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Questions",  value: (evaluation.questions || []).length, color: "text-[#7c3aed]" },
                        { label: "Responses",  value: evaluation.total_responses ?? "—",   color: "text-violet-600" },
                        { label: "Anonymous",  value: evaluation.is_anonymous ? "Yes" : "No", color: "text-amber-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                          <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions list */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Questions</p>
                    {(evaluation.questions || []).map((q, i) => {
                      const Icon   = TYPE_ICONS[q.question_type] || Star;
                      const colors = TYPE_COLORS[q.question_type] || TYPE_COLORS.text;
                      return (
                        <div key={q.id} className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                          <span className="w-6 h-6 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${colors.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                          </div>
                          <p className="text-sm text-slate-700 flex-1 truncate font-medium">{q.question_text}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                            {TYPE_LABELS[q.question_type]}
                          </span>
                        </div>
                      );
                    })}
                    {!(evaluation.questions || []).length && (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl py-8 text-center">
                        <p className="text-sm text-slate-400 mb-1">No questions yet.</p>
                        <button onClick={() => setView("add")} className="text-xs text-[#7c3aed] font-bold hover:underline">+ Add questions</button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all disabled:opacity-60 ${
                        evaluation.status === "open"
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {toggling
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : evaluation.status === "open"
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
                      {evaluation.status === "open" ? "Close Evaluation" : "Re-open Evaluation"}
                    </button>

                    <button
                      onClick={() => setView("results")}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#7c3aed]/5 border-2 border-[#7c3aed]/20 text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" /> View Results
                    </button>
                  </div>
                </>
              ) : (
                /* No evaluation yet */
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-[#7c3aed]/5 border-2 border-[#7c3aed]/10 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-10 h-10 text-[#7c3aed]/30" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-lg">No evaluation yet</p>
                    <p className="text-sm text-slate-400 mt-1">Create an evaluation so students can rate this event.</p>
                  </div>
                  <button
                    onClick={() => setView("create")}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:opacity-90 text-white rounded-xl h-10 px-6 font-bold text-sm shadow-lg shadow-violet-200 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create Evaluation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CREATE VIEW ── */}
          {view === "create" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setView("manage")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-slate-300">/</span>
                <h3 className="font-bold text-slate-800">Create Evaluation</h3>
              </div>

              {/* Form fields */}
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Event Feedback Form" className="border-slate-200 bg-slate-50 h-10 text-sm focus:bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-bold text-xs uppercase tracking-wider">
                    Description <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief instructions for students…" rows={2} className="border-slate-200 bg-slate-50 resize-none text-sm focus:bg-white" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous((v) => !v)}
                  className={`flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl border-2 w-full transition-all ${
                    isAnonymous
                      ? "bg-violet-50 border-violet-200 text-violet-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-9 h-5 rounded-full border-2 flex items-center transition-all ${isAnonymous ? "bg-violet-500 border-violet-500 justify-end pr-0.5" : "bg-slate-200 border-slate-200 justify-start pl-0.5"}`}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                  </div>
                  Anonymous responses: <span className={isAnonymous ? "text-violet-600 font-bold" : "text-slate-400"}>{isAnonymous ? "ON" : "OFF"}</span>
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Questions ({questions.length})</p>
                  <button type="button" onClick={addQ(setQuestions)} className="flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>
                {questions.map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} onChange={updQ(questions, setQuestions)} onRemove={remQ(questions, setQuestions)} />
                ))}
                {!questions.length && (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
                    <p className="text-sm text-slate-400 mb-1">No questions yet.</p>
                    <button type="button" onClick={addQ(setQuestions)} className="text-xs text-[#7c3aed] font-bold hover:underline">+ Add your first question</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button onClick={() => setView("manage")} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !questions.length}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed min-w-[160px] justify-center"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" />Create Evaluation</>}
                </button>
              </div>
            </div>
          )}

          {/* ── ADD QUESTIONS VIEW ── */}
          {view === "add" && evaluation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setView("manage")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-slate-300">/</span>
                <h3 className="font-bold text-slate-800">Add Questions</h3>
              </div>

              <div className="flex items-center gap-3 bg-violet-50 border-2 border-violet-100 rounded-xl px-4 py-3">
                <PencilLine className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <p className="text-xs text-[#7c3aed] font-medium">
                  Adding to <span className="font-bold">"{evaluation.title}"</span> — already has {(evaluation.questions || []).length} question(s).
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">New Questions ({addQuestions.length})</p>
                  <button type="button" onClick={addQ(setAddQuestions)} className="flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>
                {addQuestions.map((q, i) => (
                  <QuestionCard key={i} question={q} index={i} onChange={updQ(addQuestions, setAddQuestions)} onRemove={remQ(addQuestions, setAddQuestions)} />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button onClick={() => setView("manage")} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestions}
                  disabled={addSaving || !addQuestions.length}
                  className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed min-w-[150px] justify-center"
                >
                  {addSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" />Save Questions</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Event List ────────────────────────────────────────────────────────────────
function EventList({ onSelect }) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    axios.get("/api/officer/events", authH())
      .then((r) => setEvents(r.data.events ?? r.data))
      .catch(() => toast.error("Failed to load events."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => e.title?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    open:   events.filter(e => e.evaluation_status === "open").length,
    closed: events.filter(e => e.evaluation_status === "closed").length,
    none:   events.filter(e => !e.evaluation_status).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-md shadow-violet-200">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Evaluations</h1>
          <p className="text-sm text-slate-400">Select an event to manage its evaluation form.</p>
        </div>
      </div>

      {/* Stats */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Open",          count: counts.open,   color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
            { label: "Closed",        count: counts.closed, color: "text-slate-500",   bg: "bg-slate-50",    border: "border-slate-100"   },
            { label: "No Evaluation", count: counts.none,   color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-100"   },
          ].map(({ label, count, color, bg, border }) => (
            <div key={label} className={`${bg} border-2 ${border} rounded-2xl p-3 text-center`}>
              <p className={`text-xl font-extrabold ${color}`}>{count}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="pl-10 border-2 border-slate-100 h-10 text-sm bg-white rounded-xl focus:border-[#7c3aed]/30"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7c3aed] mx-auto mb-2" />
          <span className="text-sm text-slate-400">Loading events…</span>
        </div>
      ) : !filtered.length ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-500">No events found</p>
          {search && <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const statusConfig = event.evaluation_status === "open"
              ? { label: "Open",          cls: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-400 animate-pulse" }
              : event.evaluation_status === "closed"
              ? { label: "Closed",        cls: "bg-slate-100 text-slate-500 border-slate-200",       dot: "bg-slate-300" }
              : { label: "No Evaluation", cls: "bg-amber-50 text-amber-600 border-amber-200",         dot: "bg-amber-400" };

            return (
              <div
                key={event.id}
                onClick={() => onSelect(event)}
                className="group bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-[#7c3aed]/30 hover:shadow-lg hover:shadow-violet-50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                    <Calendar className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{event.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{event.date ?? event.event_date ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusConfig.cls}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#7c3aed] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OfficerEvaluations() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {selectedEvent
          ? <ManageEvaluation event={selectedEvent} onBack={() => setSelectedEvent(null)} />
          : <EventList onSelect={setSelectedEvent} />}
      </div>
    </div>
  );
}