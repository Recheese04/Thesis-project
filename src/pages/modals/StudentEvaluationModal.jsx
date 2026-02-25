import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Star, MessageSquare, ListChecks, ThumbsUp,
  ClipboardList, Loader2, CheckCircle2, ChevronRight,
  ChevronLeft, Send, X, AlertCircle, Lock
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const TYPE_ICONS = {
  rating: Star,
  text: MessageSquare,
  multiple_choice: ListChecks,
  yes_no: ThumbsUp,
};

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="transition-all duration-150 focus:outline-none"
          >
            <Star
              className={`w-10 h-10 transition-all duration-150 ${
                n <= (hovered || value)
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-sm'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-center text-sm font-bold text-amber-500 animate-in fade-in duration-150">
          {labels[hovered || value]}
        </p>
      )}
    </div>
  );
}

// ── Yes/No ────────────────────────────────────────────────────────────────────
function YesNoInput({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {[
        { val: true,  label: 'Yes', active: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100', idle: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300' },
        { val: false, label: 'No',  active: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-100',     idle: 'bg-white text-slate-600 border-slate-200 hover:border-red-300' },
      ].map(({ val, label, active, idle }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(val)}
          className={`flex-1 py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
            value === val ? active : idle
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Multiple Choice ───────────────────────────────────────────────────────────
function MultipleChoiceInput({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all duration-150 ${
            value === opt.id
              ? 'border-[#1e4db7] bg-blue-50 text-[#0f2d5e]'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
            value === opt.id ? 'border-[#1e4db7] bg-[#1e4db7]' : 'border-slate-300'
          }`}>
            {value === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          {opt.option_text}
        </button>
      ))}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round(((current) / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        <span>Progress</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] rounded-full transition-all duration-500"
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function StudentEvaluationModal({ open, onClose, event, onEvaluationDone }) {
  const [evaluation, setEvaluation] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState(0);   // which question we're on
  const [answers, setAnswers]       = useState({});   // { [question_id]: value }
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  // Fetch evaluation when modal opens
  useEffect(() => {
    if (!open || !event) return;
    setStep(0);
    setAnswers({});
    setDone(false);

    setLoading(true);
    axios
      .get(`/api/events/${event.id}/evaluation`, authH())
      .then((r) => {
        setEvaluation(r.data.evaluation);
        setAlreadySubmitted(r.data.submitted);
      })
      .catch(() => {
        // No evaluation — let checkout proceed normally
        setEvaluation(null);
        onEvaluationDone?.();
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, event]);

  const questions = evaluation?.questions ?? [];
  const current   = questions[step];

  const setAnswer = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const currentAnswer = current ? answers[current.id] : undefined;
  const isAnswered    = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';

  const canProceed = !current?.is_required || isAnswered;

  const handleNext = () => {
    if (step < questions.length - 1) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    // Check all required questions answered
    const unanswered = questions.filter(
      (q) => q.is_required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '')
    );
    if (unanswered.length > 0) {
      toast.error(`Please answer all required questions (${unanswered.length} remaining).`);
      // Jump to first unanswered
      const idx = questions.findIndex((q) => q.id === unanswered[0].id);
      setStep(idx);
      return;
    }

    setSubmitting(true);
    try {
      const answersPayload = questions.map((q) => {
        const val = answers[q.id];
        const base = { question_id: q.id };
        if (q.question_type === 'rating')          return { ...base, rating_value: val };
        if (q.question_type === 'text')            return { ...base, text_value: val };
        if (q.question_type === 'multiple_choice') return { ...base, option_id: val };
        if (q.question_type === 'yes_no')          return { ...base, yes_no_value: val };
        return base;
      });

      await axios.post(`/api/events/${event.id}/evaluation/submit`, { answers: answersPayload }, authH());
      setDone(true);
    } catch (err) {
      toast.error('Submission failed', {
        description: err.response?.data?.message ?? 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedCheckout = () => {
    onEvaluationDone?.();
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !submitting) onClose(); }}>
      <DialogContent className="bg-white border-0 shadow-2xl w-[calc(100vw-2rem)] sm:max-w-[480px] p-0 rounded-2xl gap-0 max-h-[90vh] flex flex-col mx-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-5 py-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-bold text-white leading-tight">
                Before you check out…
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5 line-clamp-1">
                {evaluation?.title ?? 'Event Evaluation'} · {event.title}
              </DialogDescription>
            </div>
            {/* Lock icon — students must complete before closing */}
            <div className="shrink-0">
              <Lock className="w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Progress (only when answering) */}
          {!loading && !done && !alreadySubmitted && evaluation && (
            <div className="mt-3">
              <ProgressBar current={step} total={questions.length} />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="py-16 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
              <span className="text-sm text-slate-400">Loading evaluation…</span>
            </div>
          )}

          {/* Already submitted */}
          {!loading && alreadySubmitted && (
            <div className="px-5 py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Already Submitted</p>
                <p className="text-xs text-slate-500 mt-1">
                  You've already evaluated this event. You can proceed to check out.
                </p>
              </div>
            </div>
          )}

          {/* Done state */}
          {!loading && done && (
            <div className="px-5 py-8 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">Thank you! 🎉</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Your feedback has been recorded. You can now check out of the event.
                </p>
              </div>
            </div>
          )}

          {/* Question answering */}
          {!loading && !done && !alreadySubmitted && evaluation && current && (
            <div className="px-5 py-5 space-y-5">

              {/* Question header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#0f2d5e] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step + 1}
                  </span>
                  {(() => {
                    const Icon = TYPE_ICONS[current.question_type] || Star;
                    return <Icon className="w-4 h-4 text-slate-400" />;
                  })()}
                  {current.is_required && (
                    <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-base font-bold text-slate-800 leading-snug">
                  {current.question_text}
                </p>
              </div>

              {/* Answer input */}
              <div className="min-h-[120px] flex items-center">
                <div className="w-full">
                  {current.question_type === 'rating' && (
                    <StarRating
                      value={currentAnswer ?? 0}
                      onChange={(v) => setAnswer(current.id, v)}
                    />
                  )}
                  {current.question_type === 'yes_no' && (
                    <YesNoInput
                      value={currentAnswer}
                      onChange={(v) => setAnswer(current.id, v)}
                    />
                  )}
                  {current.question_type === 'multiple_choice' && (
                    <MultipleChoiceInput
                      options={current.options ?? []}
                      value={currentAnswer}
                      onChange={(v) => setAnswer(current.id, v)}
                    />
                  )}
                  {current.question_type === 'text' && (
                    <Textarea
                      value={currentAnswer ?? ''}
                      onChange={(e) => setAnswer(current.id, e.target.value)}
                      placeholder="Write your response here…"
                      rows={4}
                      className="border-slate-200 resize-none text-sm focus-visible:ring-[#1e4db7]/30"
                    />
                  )}
                </div>
              </div>

              {/* Required warning */}
              {current.is_required && !isAnswered && step > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">This question is required.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl shrink-0">

          {/* Already submitted or done → single checkout button */}
          {(alreadySubmitted || done) && !loading && (
            <Button
              onClick={handleProceedCheckout}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white h-11 font-semibold rounded-xl"
            >
              <CheckCircle2 className="mr-2 w-4 h-4" />
              Proceed to Check Out
            </Button>
          )}

          {/* Answering questions */}
          {!loading && !done && !alreadySubmitted && evaluation && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
                className="border-slate-200 text-slate-500 h-10 w-10 p-0 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {step < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 bg-[#0f2d5e] hover:bg-[#1e4db7] text-white h-10 font-semibold rounded-xl"
                >
                  Next
                  <ChevronRight className="ml-1.5 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 text-white h-10 font-semibold rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 w-4 h-4" />
                      Submit & Check Out
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}