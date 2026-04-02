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
                $orgIds = \App\Models\Designation::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->whereNotIn('designation', ['Member'])
                    ->pluck('organization_id')
                    ->toArray();

                if (!empty($orgIds)) {
                    $query->whereHas('event', fn($q) => $q->whereIn('organization_id', $orgIds));
                } else {
                    $query->whereHas('event', fn($q) => $q->where('organization_id', 0));
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
     */
    public function store(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->isAdmin()) {
                return response()->json(['message' => 'Only officers can create evaluations.'], 403);
            }

            $orgId = $request->input('organization_id') ?: $user->getOfficerOrganizationId();
            if (!$orgId || !$user->isOfficerOf($orgId)) {
                return response()->json(['message' => 'You are not an active officer of this organization.'], 403);
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

            $event = Event::findOrFail($data['event_id']);
            if ($event->organization_id !== $orgId) {
                return response()->json(['message' => 'This event does not belong to your organization.'], 403);
            }

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
     */
    public function update(Request $request, $id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::findOrFail($id);

            if (!$user->isAdmin()) {
                if (!$user->isOfficerOf($evaluation->event->organization_id)) {
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
     */
    public function destroy($id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::findOrFail($id);

            if (!$user->isAdmin()) {
                if (!$user->isOfficerOf($evaluation->event->organization_id)) {
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

    // ── Officer: Get events for evaluation management ───────────────────────

    /**
     * GET /officer/events
     * Returns events for the authenticated officer's organization with evaluation status
     */
    public function officerEvents(Request $request)
    {
        try {
            $user  = auth()->user();
            $orgIds = \App\Models\Designation::where('user_id', $user->id)
                ->where('status', 'active')
                ->whereNotIn('designation', ['Member'])
                ->pluck('organization_id')
                ->toArray();

            if (empty($orgIds)) {
                return response()->json(['message' => 'You are not an active officer of any organization.'], 403);
            }

            $events = Event::whereIn('organization_id', $orgIds)
                ->with(['evaluation:id,event_id,status'])
                ->orderBy('event_date', 'desc')
                ->get()
                ->map(fn($event) => [
                    'id'                => $event->id,
                    'title'             => $event->title,
                    'event_date'        => $event->event_date?->format('M d, Y'),
                    'evaluation_status' => $event->evaluation?->status ?? null,
                ]);

            return response()->json(['events' => $events]);

        } catch (\Exception $e) {
            Log::error('Officer events error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching events', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Student: Submit Evaluation ─────────────────────────────────────────

    /**
     * GET /events/{eventId}/evaluation
     * Gets the evaluation form for an event (officer sees all statuses, student sees open only via submit guard)
     */
    public function getByEvent($eventId)
    {
        try {
            $evaluation = EventEvaluation::with(['questions.options'])
                ->where('event_id', $eventId)
                ->first();

            if (!$evaluation) {
                return response()->json([
                    'evaluation' => null,
                    'submitted'  => false,
                ]);
            }

            $userId    = auth()->id();
            $submitted = false;

            if ($userId) {
                $submitted = EvaluationResponse::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $userId)
                    ->exists();
            }

            return response()->json([
                'evaluation' => $evaluation,
                'submitted'  => $submitted,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /evaluations/{id}/responses
     * Student submits answers directly against the evaluation ID
     */
    public function submitResponse(Request $request, $id)
    {
        try {
            $user = auth()->user();

            $evaluation = EventEvaluation::where('id', $id)
                ->where('status', 'open')
                ->firstOrFail();

            $userId = $evaluation->is_anonymous ? null : $user->id;

            if ($userId) {
                $alreadySubmitted = EvaluationResponse::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $userId)
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
                'user_id'       => $userId,
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
            Log::error('Evaluation submitResponse error: ' . $e->getMessage());
            return response()->json(['message' => 'Error submitting evaluation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /events/{eventId}/evaluation/submit
     * Legacy submit route — kept for backward compatibility
     */
    public function submit(Request $request, $eventId)
    {
        try {
            $user = auth()->user();

            $evaluation = EventEvaluation::where('event_id', $eventId)
                ->where('status', 'open')
                ->firstOrFail();

            $userId = $evaluation->is_anonymous ? null : $user->id;

            if ($userId) {
                $alreadySubmitted = EvaluationResponse::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $userId)
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
                'user_id'       => $userId,
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

    /**
     * POST /evaluations/{id}/questions
     * Add questions to an existing evaluation
     */
    public function addQuestions(Request $request, $id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::with('questions')->findOrFail($id);

            if (!$user->isAdmin()) {
                if (!$user->isOfficerOf($evaluation->event->organization_id)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $data = $request->validate([
                'questions'                         => 'required|array|min:1',
                'questions.*.question_text'         => 'required|string',
                'questions.*.question_type'         => 'required|in:rating,text,multiple_choice,yes_no',
                'questions.*.is_required'           => 'nullable|boolean',
                'questions.*.order_index'           => 'nullable|integer',
                'questions.*.options'               => 'nullable|array',
                'questions.*.options.*.option_text' => 'required_if:questions.*.question_type,multiple_choice|string|max:255',
                'questions.*.options.*.order_index' => 'nullable|integer',
            ]);

            DB::beginTransaction();

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
                'message'    => 'Questions added successfully!',
                'evaluation' => $evaluation,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Add questions error: ' . $e->getMessage());
            return response()->json(['message' => 'Error adding questions', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Officer/Admin: View Results ────────────────────────────────────────

    /**
     * GET /evaluations/{id}/results
     */
    public function results($id)
    {
        try {
            $user       = auth()->user();
            $evaluation = EventEvaluation::with(['questions.options', 'event.organization'])
                ->findOrFail($id);

            if (!$user->isAdmin()) {
                if (!$user->isOfficerOf($evaluation->event->organization_id)) {
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

    // ── Student: List Evaluations ──────────────────────────────────────────

    /**
     * GET /student/evaluations
     * Returns all evaluations visible to the student, with has_responded flag
     */
    public function studentEvaluations(Request $request)
    {
        try {
            $user   = auth()->user();
            $userId = $user->id;

            $evaluations = EventEvaluation::with(['event:id,title', 'questions:id,evaluation_id'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($evaluation) use ($userId) {
                    $hasResponded = false;
                    if ($userId) {
                        $hasResponded = EvaluationResponse::where('evaluation_id', $evaluation->id)
                            ->where('user_id', $userId)
                            ->exists();
                    }

                    return [
                        'id'              => $evaluation->id,
                        'title'           => $evaluation->title,
                        'description'     => $evaluation->description,
                        'status'          => $evaluation->status,
                        'is_anonymous'    => $evaluation->is_anonymous,
                        'questions_count' => $evaluation->questions->count(),
                        'has_responded'   => $hasResponded,
                        'event'           => $evaluation->event ? [
                            'id'    => $evaluation->event->id,
                            'title' => $evaluation->event->title,
                        ] : null,
                    ];
                });

            return response()->json(['evaluations' => $evaluations]);

        } catch (\Exception $e) {
            Log::error('Student evaluations error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching evaluations', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /summarize
     * AI-powered summarization of evaluation text responses using Gemini 1.5 Flash
     */
    public function summarize(Request $request)
    {
        try {
            $apiKey = config('services.gemini.key');
            if (!$apiKey) {
                return response()->json(['error' => 'Gemini API Key not configured.'], 500);
            }

            $data = $request->validate([
                'inputs' => 'required|string', 
            ]);

            $systemPrompt = "You are an expert student evaluation analyst. Your task is to accurately summarize a collection of student text responses for a specific evaluation question. 
            Identify key themes, sentiments, and common feedback (both positive and negative). 
            Speak concisely and professionally in a single well-structured paragraph. 
            The responses might be in English, Tagalog, or Bisaya (Cebuano). Summarize everything in English.";

            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(60)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]]
                    ],
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [['text' => $data['inputs']]]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 1024,
                    ]
                ]);

            if ($response->successful()) {
                $resData = $response->json();
                $text = $resData['candidates'][0]['content']['parts'][0]['text'] ?? null;
                
                if (!$text) {
                    Log::error('Gemini Summarization: No text in response', ['data' => $resData]);
                    return response()->json(['error' => 'No summary text generated.'], 500);
                }

                return response()->json([
                    'summary_text' => trim($text),
                ]);
            }

            Log::error('Gemini API Summarization Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => 'AI Service Error: ' . $response->status()], $response->status());

        } catch (\Exception $e) {
            Log::error('Evaluation Summarize Exception: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}