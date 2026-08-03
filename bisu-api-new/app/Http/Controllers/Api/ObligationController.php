<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentConsequence;
use App\Models\ConsequenceRule;
use App\Models\Designation;
use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ObligationController extends Controller
{
    /**
     * Auto-detect completed events and absent members, automatically assigning
     * consequence tasks according to the organization's consequence rules.
     */
    private function autoAssignConsequencesForOrg($orgId): void
    {
        try {
            $rules = ConsequenceRule::where('organization_id', $orgId)->get();
            if ($rules->isEmpty()) return;

            $activeMemberUserIds = Designation::where('organization_id', $orgId)
                ->where('status', 'active')
                ->pluck('user_id');

            if ($activeMemberUserIds->isEmpty()) return;

            foreach ($rules as $rule) {
                $dueDate = now()->addDays($rule->due_days ?? 3)->toDateString();

                if ($rule->event_id) {
                    // Specific event rule: find absent members from this event
                    $attendedUserIds = Attendance::where('event_id', $rule->event_id)
                        ->pluck('user_id');

                    $absentUserIds = $activeMemberUserIds->diff($attendedUserIds);

                    foreach ($absentUserIds as $userId) {
                        StudentConsequence::firstOrCreate([
                            'consequence_rule_id' => $rule->id,
                            'user_id'             => $userId,
                            'event_id'            => $rule->event_id,
                        ], [
                            'type'                => $rule->type ?? 'task',
                            'status'              => 'pending',
                            'due_date'            => $dueDate,
                        ]);
                    }
                } else {
                    // Org-wide rule: check for completed/past events in this org
                    $completedEvents = Event::where('organization_id', $orgId)
                        ->where(function ($q) {
                            $q->where('status', 'completed')
                              ->orWhereRaw("CONCAT(event_date, ' ', COALESCE(end_time, event_time, '23:59:59')) <= NOW()");
                        })
                        ->get();

                    if ($completedEvents->isNotEmpty()) {
                        foreach ($completedEvents as $event) {
                            $attendedUserIds = Attendance::where('event_id', $event->id)
                                ->pluck('user_id');

                            $absentUserIds = $activeMemberUserIds->diff($attendedUserIds);

                            foreach ($absentUserIds as $userId) {
                                StudentConsequence::firstOrCreate([
                                    'consequence_rule_id' => $rule->id,
                                    'user_id'             => $userId,
                                    'event_id'            => $event->id,
                                ], [
                                    'type'                => $rule->type ?? 'task',
                                    'status'              => 'pending',
                                    'due_date'            => $dueDate,
                                ]);
                            }
                        }
                    } else {
                        // General org-wide rule when no past events exist
                        foreach ($activeMemberUserIds as $userId) {
                            StudentConsequence::firstOrCreate([
                                'consequence_rule_id' => $rule->id,
                                'user_id'             => $userId,
                                'event_id'            => null,
                            ], [
                                'type'                => $rule->type ?? 'task',
                                'status'              => 'pending',
                                'due_date'            => $dueDate,
                            ]);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("autoAssignConsequencesForOrg error (org #{$orgId}): " . $e->getMessage());
        }
    }

    /**
     * GET /api/student/obligations
     * Student view: all my consequence obligations across orgs
     */
    public function myObligations()
    {
        try {
            $userId = Auth::id();

            // Auto-assign any missing absent consequences for user's organizations
            $orgIds = Designation::where('user_id', $userId)
                ->where('status', 'active')
                ->pluck('organization_id');

            foreach ($orgIds as $orgId) {
                $this->autoAssignConsequencesForOrg($orgId);
            }

            // Fetch fees from student_fees table
            $fees = \App\Models\StudentFee::with(['organization', 'feeType'])
                ->where('user_id', $userId)
                ->get()
                ->map(fn($f) => [
                    'id'               => $f->id,
                    'type'             => 'fee',
                    'title'            => $f->feeType?->name ?? 'Fee',
                    'category'         => $f->feeType?->type ?? 'Other',
                    'description'      => $f->feeType?->description ?? null,
                    'organization'     => $f->organization?->name ?? '—',
                    'amount'           => $f->feeType?->amount ?? 0,
                    'status'           => ($f->status === 'paid' || $f->status === 'completed') ? 'completed' : ($f->status === 'submitted' ? 'submitted' : 'pending'),
                    'reference_number' => $f->reference_number,
                    'proof'            => $f->proof,
                    'due_date'         => null,
                    'completed_at'     => $f->status === 'paid' ? $f->updated_at?->toDateString() : null,
                    'created_at'       => $f->created_at?->toDateString(),
                ]);

            // Consequences assigned to me (Tasks, etc.)
            $consequences = StudentConsequence::with(['consequenceRule.organization', 'rule.organization', 'event'])
                ->where('user_id', $userId)
                ->orderByRaw("FIELD(status, 'pending', 'completed')")
                ->orderBy('due_date', 'asc')
                ->get()
                ->map(function ($c) {
                    $ruleObj = $c->consequenceRule ?? $c->rule;
                    return [
                        'id'           => $c->id,
                        'type'         => 'consequence',
                        'title'        => $ruleObj?->consequence_title ?? 'Consequence Task',
                        'description'  => $ruleObj?->consequence_description ?? null,
                        'organization' => $ruleObj?->organization?->name ?? '—',
                        'event_title'  => $c->event?->title ?? null,
                        'status'       => $c->status,
                        'due_date'     => $c->due_date?->toDateString(),
                        'completed_at' => $c->completed_at?->toDateString(),
                        'notes'        => $c->notes,
                        'created_at'   => $c->created_at?->toDateString(),
                        'consequence_type' => $c->type ?? 'task',
                    ];
                });

            return response()->json([
                'fees'         => $fees,
                'consequences' => $consequences,
            ]);
        } catch (\Exception $e) {
            Log::error('myObligations error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching obligations'], 500);
        }
    }

    /**
     * GET /api/organizations/{orgId}/obligations
     * Officer view: all obligations for this org's members
     */
    public function index($orgId)
    {
        try {
            // Auto-assign any missing absent consequences for this org's completed events
            $this->autoAssignConsequencesForOrg($orgId);

            $consequences = StudentConsequence::with(['consequenceRule', 'rule', 'user', 'event'])
                ->whereHas('consequenceRule', fn($q) => $q->where('organization_id', $orgId))
                ->orWhereHas('rule', fn($q) => $q->where('organization_id', $orgId))
                ->orderByRaw("FIELD(status, 'pending', 'completed')")
                ->orderBy('due_date', 'asc')
                ->get()
                ->map(function ($c) {
                    $ruleObj = $c->consequenceRule ?? $c->rule;
                    return [
                        'id'          => $c->id,
                        'type'        => 'consequence',
                        'title'       => $ruleObj?->consequence_title ?? 'Consequence Task',
                        'description' => $ruleObj?->consequence_description ?? '',
                        'user'        => [
                            'id'             => $c->user?->id,
                            'name'           => trim(($c->user?->first_name ?? '') . ' ' . ($c->user?->last_name ?? '')),
                            'student_number' => $c->user?->student_number ?? '',
                        ],
                        'event_title' => $c->event?->title ?? null,
                        'status'      => $c->status,
                        'due_date'    => $c->due_date?->toDateString(),
                        'completed_at'=> $c->completed_at?->toDateString(),
                        'notes'       => $c->notes,
                        'created_at'  => $c->created_at?->toDateString(),
                    ];
                });

            return response()->json([
                'consequences' => $consequences,
                'fees'         => [],
            ]);
        } catch (\Exception $e) {
            Log::error('Obligation index error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching obligations'], 500);
        }
    }

    /**
     * POST /api/organizations/{orgId}/obligations
     * Officer assigns a consequence to a member
     */
    public function store(Request $request, $orgId)
    {
        try {
            $data = $request->validate([
                'consequence_rule_id' => 'required|exists:consequence_rules,id',
                'user_id'             => 'required|exists:users,id',
                'event_id'            => 'nullable|exists:events,id',
                'due_date'            => 'nullable|date',
                'notes'               => 'nullable|string|max:500',
            ]);

            $rule = ConsequenceRule::findOrFail($data['consequence_rule_id']);

            $consequence = StudentConsequence::create([
                'consequence_rule_id' => $data['consequence_rule_id'],
                'user_id'             => $data['user_id'],
                'event_id'            => $data['event_id'] ?? null,
                'status'              => 'pending',
                'type'                => $rule->type ?? 'task',
                'due_date'            => $data['due_date'] ?? now()->addDays($rule->due_days ?? 3)->toDateString(),
                'notes'               => $data['notes'] ?? null,
            ]);

            $consequence->load(['consequenceRule', 'user', 'event']);

            return response()->json($consequence, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Obligation store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating obligation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/obligations/{id}
     * Mark complete or update notes
     */
    public function update(Request $request, $id)
    {
        try {
            $consequence = StudentConsequence::findOrFail($id);

            $data = $request->validate([
                'status' => 'sometimes|in:pending,completed',
                'notes'  => 'nullable|string|max:500',
            ]);

            if (isset($data['status']) && $data['status'] === 'completed') {
                $data['completed_at'] = now();
            } elseif (isset($data['status']) && $data['status'] === 'pending') {
                $data['completed_at'] = null;
            }

            $consequence->update($data);

            return response()->json($consequence);
        } catch (\Exception $e) {
            Log::error('Obligation update error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating obligation'], 500);
        }
    }

    /**
     * DELETE /api/obligations/{id}
     */
    public function destroy($id)
    {
        try {
            StudentConsequence::findOrFail($id)->delete();
            return response()->json(['message' => 'Obligation deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting obligation'], 500);
        }
    }
}
