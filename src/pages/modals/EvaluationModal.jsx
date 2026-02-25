import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus, Trash2, Loader2, CheckCircle2, X, Star,
  ClipboardList, BarChart3, MessageSquare, ListChecks,
  ThumbsUp, ToggleLeft, ToggleRight, Sparkles, ChevronDown, ChevronUp, PencilLine,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const TYPE_ICONS = {
  rating: Star,
  text: MessageSquare,
  multiple_choice: ListChecks,
  yes_no: ThumbsUp,
};

const TYPE_LABELS = {
  rating: "Rating (1–5)",
  text: "Open Text",
  multiple_choice: "Multiple Choice",
  yes_no: "Yes / No",
};

const EMPTY_QUESTION = {
  question_text: "",
  question_type: "rating",
  is_required: true,
  order_index: 0,
  options: [],
};

// ── AI Summary Box ─────────────────────────────────────────────────────────────
function AISummaryBox({ question, responses }) {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleSummarize = async () => {
    if (responses.length === 0) {
      toast.error("No text responses to summarize.");
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      const inputText = `Question: "${question}". Student responses: ${responses
        .map((r, i) => `(${i + 1}) ${r}`)
        .join(" ")}`;

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ inputs: inputText }),
      });

      const data = await res.json();
      console.log("[AISummaryBox] raw API response:", data);

      if (data?.error) {
        if (
          typeof data.error === "string" &&
          (data.error.includes("loading") || data.error.includes("currently loading"))
        ) {
          toast.error("Model is loading — please wait ~20 seconds and try again.");
        } else {
          toast.error(`API error: ${data.error}`);
        }
        return;
      }

      let text = "";
      if (Array.isArray(data)) {
        text = data[0]?.summary_text || data[0]?.generated_text || (typeof data[0] === "string" ? data[0] : "");
      } else if (typeof data === "object" && data !== null) {
        text = data.summary_text || data.generated_text || data.result || data.summary || data.output || "";
      } else if (typeof data === "string") {
        text = data;
      }

      text = text.trim();

      if (!text) {
        console.error("[AISummaryBox] Could not find summary text in response:", data);
        throw new Error(
          `Unexpected response shape — check console for details. Keys received: ${
            Array.isArray(data)
              ? JSON.stringify(Object.keys(data[0] ?? {}))
              : JSON.stringify(Object.keys(data ?? {}))
          }`
        );
      }

      setSummary(text);
      setExpanded(true);
    } catch (err) {
      console.error("[AISummaryBox] error:", err);
      toast.error("Failed to generate summary.", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-purple-700">AI Summary</span>
          {responses.length > 0 && (
            <span className="text-[10px] text-purple-400 font-medium">
              {responses.length} response{responses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {summary && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-purple-400 hover:text-purple-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={handleSummarize}
            disabled={loading || responses.length === 0}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              loading || responses.length === 0
                ? "bg-purple-100 text-purple-300 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Summarizing…</>
            ) : (
              <><Sparkles className="w-3 h-3" />{summary ? "Re-summarize" : "Summarize"}</>
            )}
          </button>
        </div>
      </div>

      {summary && expanded && (
        <div className="px-3 pb-3">
          <div className="bg-white border border-purple-100 rounded-lg px-3 py-2.5">
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {!summary && !loading && (
        <div className="px-3 pb-3">
          <p className="text-xs text-purple-400 italic">
            {responses.length === 0
              ? "No text responses yet to summarize."
              : "Click 'Summarize' to generate an AI summary of all responses."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Question Card ──────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onRemove }) {
  const TypeIcon = TYPE_ICONS[question.question_type] || Star;
  const setField = (field, value) => onChange(index, { ...question, [field]: value });
  const addOption = () =>
    setField("options", [
      ...(question.options || []),
      { option_text: "", order_index: (question.options || []).length },
    ]);
  const updateOption = (i, text) => {
    const opts = [...(question.options || [])];
    opts[i] = { ...opts[i], option_text: text };
    setField("options", opts);
  };
  const removeOption = (i) =>
    setField("options", (question.options || []).filter((_, idx) => idx !== i));

  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#0f2d5e] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <TypeIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">{TYPE_LABELS[question.question_type]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setField("is_required", !question.is_required)}
            className={
              "text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors " +
              (question.is_required
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-slate-100 text-slate-400 border-slate-200")
            }
          >
            {question.is_required ? "Required" : "Optional"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Input
        value={question.question_text}
        onChange={(e) => setField("question_text", e.target.value)}
        placeholder="Enter your question..."
        className="border-slate-200 bg-white h-9 text-sm"
        required
      />

      <Select value={question.question_type} onValueChange={(v) => setField("question_type", v)}>
        <SelectTrigger className="border-slate-200 bg-white h-9 text-sm w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {Object.entries(TYPE_LABELS).map(([val, label]) => {
            const Icon = TYPE_ICONS[val];
            return (
              <SelectItem key={val} value={val}>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {question.question_type === "multiple_choice" && (
        <div className="space-y-2 pt-1">
          {(question.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
              <Input
                value={opt.option_text}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={"Option " + (i + 1)}
                className="border-slate-200 bg-white h-8 text-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 text-xs text-[#1e4db7] font-semibold hover:underline mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Option
          </button>
        </div>
      )}

      {question.question_type === "rating" && (
        <div className="flex items-center gap-1 pt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="w-5 h-5 text-slate-200 fill-slate-200" />
          ))}
          <span className="text-xs text-slate-400 ml-2">1–5 scale</span>
        </div>
      )}

      {question.question_type === "yes_no" && (
        <div className="flex items-center gap-2 pt-1">
          <Badge className="bg-green-50 text-green-700 border-green-200 border text-xs">Yes</Badge>
          <Badge className="bg-red-50 text-red-700 border-red-200 border text-xs">No</Badge>
        </div>
      )}
    </div>
  );
}

// ── Results View ───────────────────────────────────────────────────────────────
function ResultsView({ evaluationId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/evaluations/" + evaluationId + "/results", authH())
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load results"))
      .finally(() => setLoading(false));
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7] mx-auto mb-2" />
        <span className="text-sm text-slate-400">Loading results…</span>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-slate-400 py-10 text-sm">No results available.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0f2d5e]/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-[#0f2d5e]">{data.total_responses}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Responses</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-purple-700">{data.results?.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Questions</p>
        </div>
      </div>

      {(data.results || []).map((r, i) => {
        const TypeIcon = TYPE_ICONS[r.question_type] || Star;
        return (
          <div key={r.question_id} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#0f2d5e] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{r.question_text}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TypeIcon className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {TYPE_LABELS[r.question_type]} &middot; {r.total_answers} answer{r.total_answers !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {r.question_type === "rating" && r.average_rating != null && (
              <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        "w-5 h-5 " +
                        (n <= Math.round(r.average_rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200 fill-slate-200")
                      }
                    />
                  ))}
                </div>
                <span className="text-lg font-extrabold text-amber-600">{r.average_rating}</span>
                <span className="text-xs text-slate-400">/ 5.00</span>
              </div>
            )}

            {r.question_type === "yes_no" && (
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-extrabold text-green-700">{r.yes_count}</p>
                  <p className="text-xs text-green-600 font-medium">Yes</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-extrabold text-red-600">{r.no_count}</p>
                  <p className="text-xs text-red-500 font-medium">No</p>
                </div>
              </div>
            )}

            {r.question_type === "multiple_choice" && (
              <div className="space-y-2">
                {(r.option_counts || []).map((opt) => {
                  const pct = r.total_answers > 0 ? Math.round((opt.count / r.total_answers) * 100) : 0;
                  return (
                    <div key={opt.option_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">{opt.option_text}</span>
                        <span className="text-slate-400">{opt.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] rounded-full transition-all"
                          style={{ width: pct + "%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {r.question_type === "text" && (
              <div className="space-y-2">
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {r.text_responses && r.text_responses.length > 0 ? (
                    r.text_responses.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-700"
                      >
                        {t}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No text responses yet.</p>
                  )}
                </div>
                <AISummaryBox question={r.question_text} responses={r.text_responses ?? []} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Add Questions View ─────────────────────────────────────────────────────────
function AddQuestionsView({ evaluation, onSuccess, onCancel }) {
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION }]);
  const [saving, setSaving]       = useState(false);

  const existingCount = (evaluation.questions || []).length;

  const addQuestion = () =>
    setQuestions((prev) => [...prev, { ...EMPTY_QUESTION, order_index: prev.length }]);

  const updateQuestion = (index, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (questions.some((q) => !q.question_text.trim())) {
      toast.error("All questions must have text.");
      return;
    }
    setSaving(true);
    try {
      const newQuestions = questions.map((q, i) => ({
        ...q,
        order_index: existingCount + i,
      }));

      const res = await axios.post(
        `/api/evaluations/${evaluation.id}/questions`,
        { questions: newQuestions },
        authH()
      );

      toast.success("Questions added!", { description: res.data.message ?? `${questions.length} question(s) added.` });
      onSuccess(res.data.evaluation ?? null);
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error("Error", {
        description: errs
          ? Object.values(errs).flat().join("\n")
          : err.response?.data?.message ?? "An error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Info banner */}
      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <PencilLine className="w-4 h-4 text-[#1e4db7] shrink-0" />
        <p className="text-xs text-[#1e4db7] font-medium">
          Adding to <span className="font-bold">"{evaluation.title}"</span> — already has {existingCount} question{existingCount !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Question builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            New Questions ({questions.length})
          </p>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs font-semibold text-[#1e4db7] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        </div>

        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            question={q}
            index={i}
            onChange={updateQuestion}
            onRemove={removeQuestion}
          />
        ))}

        {questions.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
            <p className="text-sm text-slate-400">No new questions yet.</p>
            <button
              type="button"
              onClick={addQuestion}
              className="text-xs text-[#1e4db7] font-semibold mt-1 hover:underline"
            >
              + Add your first question
            </button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-200 text-slate-600 h-9"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || questions.length === 0}
          className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white min-w-[150px] h-9"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" />Save Questions</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main Evaluation Modal ──────────────────────────────────────────────────────
export default function EvaluationModal({ open, onClose, event }) {
  const [view, setView]           = useState("manage");
  const [evaluation, setEval]     = useState(null);
  const [loadingEval, setLoading] = useState(false);

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions]     = useState([{ ...EMPTY_QUESTION }]);
  const [saving, setSaving]           = useState(false);
  const [toggling, setToggling]       = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    setView("manage");
    setLoading(true);
    axios
      .get("/api/events/" + event.id + "/evaluation", authH())
      .then((r) => setEval(r.data.evaluation))
      .catch(() => setEval(null))
      .finally(() => setLoading(false));
  }, [open, event]);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setIsAnonymous(false);
    setQuestions([{ ...EMPTY_QUESTION }]);
  };

  const addQuestion = () =>
    setQuestions((prev) => [...prev, { ...EMPTY_QUESTION, order_index: prev.length }]);

  const updateQuestion = (index, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (questions.some((q) => !q.question_text.trim())) {
      toast.error("All questions must have text.");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        "/api/evaluations",
        {
          event_id:     event.id,
          title:        title || "Event Evaluation",
          description,
          is_anonymous: isAnonymous,
          questions:    questions.map((q, i) => ({ ...q, order_index: i })),
        },
        authH()
      );
      toast.success("Evaluation Created!", { description: res.data.message });
      setEval(res.data.evaluation);
      resetCreate();
      setView("manage");
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error("Error", {
        description: errs
          ? Object.values(errs).flat().join("\n")
          : err.response?.data?.message ?? "An error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!evaluation) return;
    setToggling(true);
    const newStatus = evaluation.status === "open" ? "closed" : "open";
    try {
      await axios.put("/api/evaluations/" + evaluation.id, { status: newStatus }, authH());
      setEval((prev) => ({ ...prev, status: newStatus }));
      toast.success("Evaluation " + (newStatus === "open" ? "opened" : "closed") + ".");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setToggling(false);
    }
  };

  // Called when AddQuestionsView successfully saves
  const handleQuestionsAdded = (updatedEvaluation) => {
    if (updatedEvaluation) {
      setEval(updatedEvaluation);
    } else {
      // Re-fetch if the API didn't return the updated evaluation
      axios
        .get("/api/events/" + event.id + "/evaluation", authH())
        .then((r) => setEval(r.data.evaluation))
        .catch(() => {});
    }
    setView("manage");
  };

  if (!event) return null;

  // Tabs visible when evaluation exists (add "add" to the tab list)
  const tabs = evaluation
    ? [
        { id: "manage",  label: "Manage"       },
        { id: "results", label: "Results"       },
        { id: "add",     label: "+ Questions"   },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-white border-0 shadow-2xl w-[calc(100vw-2rem)] sm:max-w-[600px] p-0 rounded-2xl gap-0 max-h-[90vh] flex flex-col mx-4">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-5 py-4 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-white">Event Evaluation</DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5 truncate">{event.title}</DialogDescription>
            </div>

            {/* Tab switcher — only shown when evaluation exists */}
            {tabs.length > 0 && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className={
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-colors " +
                      (view === tab.id ? "bg-white text-[#0f2d5e]" : "text-white/70 hover:text-white")
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">

          {loadingEval && (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7] mx-auto mb-2" />
              <span className="text-sm text-slate-400">Checking evaluation…</span>
            </div>
          )}

          {/* MANAGE VIEW */}
          {!loadingEval && view === "manage" && (
            <div className="px-5 py-5 space-y-4">
              {evaluation ? (
                <>
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{evaluation.title}</p>
                        {evaluation.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{evaluation.description}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          "shrink-0 border text-xs font-semibold px-2.5 py-1 capitalize " +
                          (evaluation.status === "open"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-500 border-slate-200")
                        }
                      >
                        {evaluation.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-lg font-extrabold text-[#0f2d5e]">{(evaluation.questions || []).length}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Questions</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-lg font-extrabold text-purple-600">{evaluation.total_responses ?? "—"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Responses</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-100">
                        <p className="text-lg font-extrabold text-amber-500">{evaluation.is_anonymous ? "Yes" : "No"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Anonymous</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</p>
                      {/* Quick shortcut to add questions */}
                      <button
                        onClick={() => setView("add")}
                        className="flex items-center gap-1 text-xs font-semibold text-[#1e4db7] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Questions
                      </button>
                    </div>
                    {(evaluation.questions || []).map((q, i) => {
                      const Icon = TYPE_ICONS[q.question_type] || Star;
                      return (
                        <div key={q.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="w-5 h-5 rounded-md bg-[#0f2d5e]/10 text-[#0f2d5e] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <p className="text-sm text-slate-700 flex-1 truncate">{q.question_text}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{TYPE_LABELS[q.question_type]}</span>
                        </div>
                      );
                    })}

                    {(evaluation.questions || []).length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl py-6 text-center">
                        <p className="text-sm text-slate-400">No questions yet.</p>
                        <button
                          onClick={() => setView("add")}
                          className="text-xs text-[#1e4db7] font-semibold mt-1 hover:underline"
                        >
                          + Add your first question
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleToggleStatus}
                    disabled={toggling}
                    className={
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border transition-colors " +
                      (evaluation.status === "open"
                        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100")
                    }
                  >
                    {toggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : evaluation.status === "open" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    {evaluation.status === "open"
                      ? "Close Evaluation (stop accepting responses)"
                      : "Re-open Evaluation"}
                  </button>
                </>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#0f2d5e]/5 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-8 h-8 text-[#0f2d5e]/30" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">No evaluation yet</p>
                    <p className="text-xs text-slate-400 mt-1">Create an evaluation form so students can rate this event.</p>
                  </div>
                  <Button
                    onClick={() => { resetCreate(); setView("create"); }}
                    className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white rounded-xl h-9 px-5 font-semibold text-sm"
                  >
                    <Plus className="mr-1.5 w-4 h-4" />
                    Create Evaluation
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* CREATE VIEW */}
          {!loadingEval && view === "create" && (
            <form onSubmit={handleCreate} className="px-5 py-5 space-y-5">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-xs">Evaluation Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Event Feedback Form"
                    className="border-slate-200 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-xs">
                    Description <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief instructions for students..."
                    rows={2}
                    className="border-slate-200 resize-none text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous((v) => !v)}
                  className={
                    "flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border w-full transition-colors " +
                    (isAnonymous
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-slate-50 border-slate-200 text-slate-500")
                  }
                >
                  {isAnonymous ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>Anonymous responses: {isAnonymous ? "ON" : "OFF"}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Questions ({questions.length})
                  </p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1 text-xs font-semibold text-[#1e4db7] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </button>
                </div>

                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    question={q}
                    index={i}
                    onChange={updateQuestion}
                    onRemove={removeQuestion}
                  />
                ))}

                {questions.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                    <p className="text-sm text-slate-400">No questions yet.</p>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-xs text-[#1e4db7] font-semibold mt-1 hover:underline"
                    >
                      + Add your first question
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ADD QUESTIONS VIEW */}
          {!loadingEval && view === "add" && evaluation && (
            <AddQuestionsView
              evaluation={evaluation}
              onSuccess={handleQuestionsAdded}
              onCancel={() => setView("manage")}
            />
          )}

          {/* RESULTS VIEW */}
          {!loadingEval && view === "results" && evaluation && (
            <div className="px-5 py-5">
              <ResultsView evaluationId={evaluation.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
          {view === "create" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("manage")}
                className="border-slate-200 text-slate-600 h-9"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || questions.length === 0}
                className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white min-w-[130px] h-9"
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" />Create Evaluation</>
                )}
              </Button>
            </>
          ) : view === "add" ? (
            // Footer hidden for "add" view — it has its own inline actions
            <div className="w-full" />
          ) : (
            <>
              {evaluation && view === "manage" && (
                <Button
                  variant="outline"
                  onClick={() => setView("results")}
                  className="border-slate-200 text-[#0f2d5e] h-9 gap-1.5 text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Results
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 text-slate-600 h-9 ml-auto"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}