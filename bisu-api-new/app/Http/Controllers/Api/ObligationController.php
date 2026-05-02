<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentConsequence;
use App\Models\MembershipFee;
use App\Models\ConsequenceRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ObligationController extends Controller
{
    /**
     * GET /api/student/obligations
     * Student view: all my obligations (fees + consequences) across orgs
     */
    public function myObligations()
    {
        try {
            $userId = Auth::id();

            // Fetch fees from student_fees table (includes automated fines)
            $fees = \App\Models\StudentFee::with(['organization', 'feeType'])
                ->where('user_id', $userId)
                ->get()
                ->map(fn($f) => [
                    'id'           => $f->id,
                    'type'         => 'fee',
                    'title'        => $f->feeType->name ?? 'Fee',
                    'description'  => $f->feeType->description ?? null,
                    'organization' => $f->organization->name ?? '—',
                    'amount'       => $f->feeType->amount ?? 0,
                    'status'       => $f->status === 'paid' ? 'completed' : 'pending',
                    'due_date'     => null,
                    'completed_at' => $f->status === 'paid' ? $f->updated_at?->toDateString() : null,
                    'created_at'   => $f->created_at?->toDateString(),
                ]);

            // Consequences assigned to me (Tasks, etc.)
            $consequences = StudentConsequence::with(['rule.organization', 'event'])
                ->where('user_id', $userId)
                ->orderByRaw("FIELD(status, 'pending', 'completed')")
                ->orderBy('due_date', 'asc')
                ->get()
                ->map(fn($c) => [
                    'id'           => $c->id,
                    'type'         => 'consequence',
                    'title'        => $c->rule->consequence_title ?? 'Consequence',
                    'description'  => $c->rule->consequence_description ?? null,
                    'organization' => $c->rule->organization->name ?? '—',
                    'event_title'  => $c->event->title ?? null,
                    'status'       => $c->status,
                    'due_date'     => $c->due_date?->toDateString(),
                    'completed_at' => $c->completed_at?->toDateString(),
                    'notes'        => $c->notes,
                    'created_at'   => $c->created_at?->toDateString(),
                    'consequence_type' => $c->type, // financial, task, etc.
                ]);

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
            $consequences = StudentConsequence::with(['consequenceRule', 'user', 'event'])
                ->whereHas('consequenceRule', fn($q) => $q->where('organization_id', $orgId))
                ->orderByRaw("FIELD(status, 'pending', 'completed')")
                ->orderBy('due_date', 'asc')
                ->get()
                ->map(fn($c) => [
                    'id'          => $c->id,
                    'type'        => 'consequence',
                    'title'       => $c->consequenceRule->consequence_title ?? '',
                    'description' => $c->consequenceRule->consequence_description ?? '',
                    'user'        => [
                        'id'        => $c->user->id,
                        'name'      => trim(($c->user->first_name ?? '') . ' ' . ($c->user->last_name ?? '')),
                        'student_number' => $c->user->student_number ?? '',
                    ],
                    'event_title' => $c->event->title ?? null,
                    'status'      => $c->status,
                    'due_date'    => $c->due_date?->toDateString(),
                    'completed_at'=> $c->completed_at?->toDateString(),
                    'notes'       => $c->notes,
                    'created_at'  => $c->created_at?->toDateString(),
                ]);

            // Fetch fees from student_fees table (includes automated fines)
            $fees = \App\Models\StudentFee::with(['user', 'feeType'])
                ->where('organization_id', $orgId)
                ->orderByRaw("FIELD(status, 'pending', 'paid')")
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($f) => [
                    'id'          => $f->id,
                    'type'        => 'fee',
                    'title'       => $f->feeType->name ?? 'Fee',
                    'description' => $f->feeType->description ?? '',
                    'user'        => [
                        'id'        => $f->user->id ?? null,
                        'name'      => trim(($f->user->first_name ?? '') . ' ' . ($f->user->last_name ?? '')),
                        'student_number' => $f->user->student_number ?? '',
                    ],
                    'amount'      => $f->feeType->amount ?? 0,
                    'status'      => $f->status === 'paid' ? 'completed' : 'pending',
                    'due_date'    => null,
                    'completed_at'=> $f->status === 'paid' ? $f->updated_at?->toDateString() : null,
                    'created_at'  => $f->created_at?->toDateString(),
                ]);

            return response()->json([
                'consequences' => $consequences,
                'fees'         => $fees,
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

            // Get the rule for default due_days
            $rule = ConsequenceRule::findOrFail($data['consequence_rule_id']);

            $consequence = StudentConsequence::create([
                'consequence_rule_id' => $data['consequence_rule_id'],
                'user_id'             => $data['user_id'],
                'event_id'            => $data['event_id'] ?? null,
                'status'              => 'pending',
                'due_date'            => $data['due_date'] ?? now()->addDays($rule->due_days)->toDateString(),
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
