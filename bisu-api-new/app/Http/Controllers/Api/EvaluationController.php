<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventEvaluation;
use App\Models\EvaluationQuestion;
use App\Models\EvaluationQuestionOption;
use App\Models\EvaluationResponse;
use App\Models\EvaluationAnswer;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EvaluationController extends Controller
{
    // ── Officer/Admin: Manage Evaluations ──────────────────────────────────

    /**
     * GET /evaluations
     * List all evaluations (admin sees all, officer sees their org only)
     */
    public function index(Request $request)
    {
        try {
            $user  = auth()->user();
            $query = EventEvaluation::with(['event.organization', 'questions'])
                ->orderBy('created_at', 'desc');

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if ($orgId) {
                    $query->whereHas('event', fn($q) => $q->where('organization_id', $orgId));
                }
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            Log::error('Evaluation index error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching evaluations', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /evaluations/{id}
     * Get a single evaluation with questions and options
     */
    public function show($id)
    {
        try {
            $evaluation = EventEvaluation::with(['event.organization', 'questions.options'])
                ->findOrFail($id);

            return response()->json($evaluation);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Evaluation not found'], 404);
        }
    }

    /**
     * POST /evaluations
     * Officer creates an evaluation form for an event
     * Body: { event_id, title, description, is_anonymous, questions: [{ question_text, question_type, is_required, order_index, options: [] }] }
     */
    public function store(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->isAdmin()) {
                return response()->json(['message' => 'Only officers can create evaluations.'], 403);
            }

            $orgId = $user->getOfficerOrganizationId();
            if (!$orgId) {
                return response()->json(['message' => 'You are not an active officer of any organization.'], 403);
            }

            $data = $request->validate([
                'event_id'                          => 'required|exists:events,id',
                'title'                             => 'nullable|string|max:255',
                'description'                       => 'nullable|string',
                'is_anonymous'                      => 'nullable|boolean',
                'questions'                         => 'required|array|min:1',
                'questions.*.question_text'         => 'required|string',
                'questions.*.question_type'         => 'required|in:rating,text,multiple_choice,yes_no',
                'questions.*.is_required'           => 'nullable|boolean',
                'questions.*.order_index'           => 'nullable|integer',
                'questions.*.options'               => 'nullable|array',
                'questions.*.options.*.option_text' => 'required_if:questions.*.question_type,multiple_choice|string|max:255',
                'questions.*.options.*.order_index' => 'nullable|integer',
            ]);

            // Make sure the event belongs to the officer's org
            $event = Event::findOrFail($data['event_id']);
            if ($event->organization_id !== $orgId) {
                return response()->json(['message' => 'This event does not belong to your organization.'], 403);
            }

            // Only one evaluation per event
            $exists = EventEvaluation::where('event_id', $data['event_id'])->exists();
            if ($exists) {
                return response()->json(['message' => 'An evaluation for this event already exists.'], 422);
            }

            DB::beginTransaction();

            $evaluation = EventEvaluation::create([
                'event_id'     => $data['event_id'],
                'title'        => $data['title'] ?? 'Event Evaluation',
                'description'  => $data['description'] ?? null,
                'is_anonymous' => $data['is_anonymous'] ?? false,
                'status'       => 'open',
                'created_by'   => $user->id,
            ]);

            foreach ($data['questions'] as $index => $q) {
                $question = EvaluationQuestion::create([
                    'evaluation_id' => $evaluation->id,
                    'question_text' => $q['question_text'],
                    'question_type' => $q['question_type'],
                    'is_required'   => $q['is_required'] ?? true,
                    'order_index'   => $q['order_index'] ?? $index,
                ]);

                if ($q['question_type'] === 'multiple_choice' && !empty($q['options'])) {
                    foreach ($q['options'] as $optIndex => $opt) {
                        EvaluationQuestionOption::create([
                            'question_id' => $question->id,
                            'option_text' => $opt['option_text'],
                            'order_index' => $opt['order_index'] ?? $optIndex,
                        ]);
                    }
                }
            }

            DB::commit();

            $evaluation->load(['event.organization', 'questions.options']);

            return response()->json([
                'message'    => 'Evaluation has been created successfully!',
                'evaluation' => $evaluation,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Evaluation store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /evaluations/{id}
     * Update evaluation status (open/closed) and basic info
     * Body: { title, description, is_anonymous, status }
     */
    public function update(Request $request, $id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::findOrFail($id);

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if (!$orgId || $evaluation->event->organization_id !== $orgId) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $data = $request->validate([
                'title'        => 'nullable|string|max:255',
                'description'  => 'nullable|string',
                'is_anonymous' => 'nullable|boolean',
                'status'       => 'nullable|in:open,closed',
            ]);

            $evaluation->update($data);
            $evaluation->load(['event.organization', 'questions.options']);

            return response()->json([
                'message'    => 'Evaluation has been updated successfully!',
                'evaluation' => $evaluation,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Evaluation update error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /evaluations/{id}
     * Delete an evaluation (cascades to questions, options, responses, answers)
     */
    public function destroy($id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::findOrFail($id);

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if (!$orgId || $evaluation->event->organization_id !== $orgId) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $evaluation->delete();

            return response()->json(['message' => 'Evaluation deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Evaluation delete error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Student: Submit Evaluation ─────────────────────────────────────────

    /**
     * GET /events/{eventId}/evaluation
     * Student gets the evaluation form for an event
     */
    public function getByEvent($eventId)
    {
        try {
            $evaluation = EventEvaluation::with(['questions.options'])
                ->where('event_id', $eventId)
                ->where('status', 'open')
                ->firstOrFail();

            // Check if student already submitted
            $user      = auth()->user();
            $studentId = $user->student_id;
            $submitted = false;

            if ($studentId) {
                $submitted = EvaluationResponse::where('evaluation_id', $evaluation->id)
                    ->where('student_id', $studentId)
                    ->exists();
            }

            return response()->json([
                'evaluation' => $evaluation,
                'submitted'  => $submitted,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'No open evaluation found for this event'], 404);
        }
    }

    /**
     * POST /events/{eventId}/evaluation/submit
     * Student submits their evaluation answers
     * Body: { answers: [{ question_id, rating_value, text_value, option_id, yes_no_value }] }
     */
    public function submit(Request $request, $eventId)
    {
        try {
            $user = auth()->user();

            $evaluation = EventEvaluation::where('event_id', $eventId)
                ->where('status', 'open')
                ->firstOrFail();

            $studentId = $evaluation->is_anonymous ? null : $user->student_id;

            // Check if already submitted (non-anonymous)
            if ($studentId) {
                $alreadySubmitted = EvaluationResponse::where('evaluation_id', $evaluation->id)
                    ->where('student_id', $studentId)
                    ->exists();

                if ($alreadySubmitted) {
                    return response()->json(['message' => 'You have already submitted an evaluation for this event.'], 422);
                }
            }

            $data = $request->validate([
                'answers'                => 'required|array|min:1',
                'answers.*.question_id'  => 'required|exists:evaluation_questions,id',
                'answers.*.rating_value' => 'nullable|integer|min:1|max:5',
                'answers.*.text_value'   => 'nullable|string',
                'answers.*.option_id'    => 'nullable|exists:evaluation_question_options,id',
                'answers.*.yes_no_value' => 'nullable|boolean',
            ]);

            DB::beginTransaction();

            $response = EvaluationResponse::create([
                'evaluation_id' => $evaluation->id,
                'student_id'    => $studentId,
                'submitted_at'  => now(),
            ]);

            foreach ($data['answers'] as $answer) {
                EvaluationAnswer::create([
                    'response_id'  => $response->id,
                    'question_id'  => $answer['question_id'],
                    'rating_value' => $answer['rating_value'] ?? null,
                    'text_value'   => $answer['text_value'] ?? null,
                    'option_id'    => $answer['option_id'] ?? null,
                    'yes_no_value' => $answer['yes_no_value'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json(['message' => 'Evaluation submitted successfully. Thank you!'], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Evaluation submit error: ' . $e->getMessage());
            return response()->json(['message' => 'Error submitting evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Officer/Admin: View Results ────────────────────────────────────────

    /**
     * GET /evaluations/{id}/results
     * Get evaluation results with average ratings and all text responses
     */
    public function results($id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::with(['questions.options', 'event.organization'])
                ->findOrFail($id);

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if (!$orgId || $evaluation->event->organization_id !== $orgId) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $totalResponses = $evaluation->responses()->count();

            $results = $evaluation->questions->map(function ($question) {
                $answers = EvaluationAnswer::where('question_id', $question->id)->get();

                $summary = [
                    'question_id'   => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'total_answers' => $answers->count(),
                ];

                if ($question->question_type === 'rating') {
                    $summary['average_rating'] = $answers->avg('rating_value')
                        ? round($answers->avg('rating_value'), 2)
                        : null;
                }

                if ($question->question_type === 'text') {
                    $summary['text_responses'] = $answers->pluck('text_value')->filter()->values();
                }

                if ($question->question_type === 'yes_no') {
                    $summary['yes_count'] = $answers->where('yes_no_value', true)->count();
                    $summary['no_count']  = $answers->where('yes_no_value', false)->count();
                }

                if ($question->question_type === 'multiple_choice') {
                    $summary['option_counts'] = $question->options->map(function ($option) use ($answers) {
                        return [
                            'option_id'   => $option->id,
                            'option_text' => $option->option_text,
                            'count'       => $answers->where('option_id', $option->id)->count(),
                        ];
                    });
                }

                return $summary;
            });

            return response()->json([
                'evaluation'      => $evaluation,
                'total_responses' => $totalResponses,
                'results'         => $results,
            ]);

        } catch (\Exception $e) {
            Log::error('Evaluation results error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching results', 'error' => $e->getMessage()], 500);
        }
    }
}