<?php

namespace App\Http\Controllers\Api;  // ← FIXED (was App\Http\Controllers)

use App\Http\Controllers\Controller;
use App\Models\ConsequenceRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConsequenceRuleController extends Controller
{
    // GET /api/organizations/{orgId}/consequence-rules
    public function index($orgId)
    {
        $rules = ConsequenceRule::with('event')
            ->where('organization_id', $orgId)
            ->latest()
            ->get();

        return response()->json($rules);
    }

    // POST /api/organizations/{orgId}/consequence-rules
    public function store(Request $request, $orgId)
    {
        $validated = $request->validate([
            'event_id'                => 'nullable|exists:events,id',
            'consequence_title'       => 'required|string|max:255',
            'consequence_description' => 'nullable|string',
            'due_days'                => 'required|integer|min:1',
            'type'                    => 'required|in:financial,task,warning,suspension',
            'fee_type_id'             => 'nullable|exists:fee_types,id',
        ]);

        $rule = ConsequenceRule::create([
            ...$validated,
            'organization_id' => $orgId,
            'created_by'      => Auth::id(),
        ]);

        // Auto-assign rule to members
        try {
            $activeMembers = \App\Models\Designation::where('organization_id', $orgId)
                ->where('status', 'active')
                ->pluck('user_id');

            $dueDate = now()->addDays($rule->due_days)->toDateString();

            foreach ($activeMembers as $userId) {
                if ($rule->event_id) {
                    // Event-specific: check if member attended
                    $attended = \App\Models\Attendance::where('event_id', $rule->event_id)
                        ->where('user_id', $userId)
                        ->exists();

                    if (!$attended) {
                        \App\Models\StudentConsequence::firstOrCreate([
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
                    // Org-wide: assign to all active members
                    \App\Models\StudentConsequence::firstOrCreate([
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
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error auto-assigning consequence rule: ' . $e->getMessage());
        }

        return response()->json($rule, 201);
    }

    // PUT /api/consequence-rules/{id}
    public function update(Request $request, $id)
    {
        $rule = ConsequenceRule::findOrFail($id);

        $validated = $request->validate([
            'event_id'                => 'nullable|exists:events,id',
            'consequence_title'       => 'required|string|max:255',
            'consequence_description' => 'nullable|string',
            'due_days'                => 'required|integer|min:1',
            'type'                    => 'required|in:financial,task,warning,suspension',
            'fee_type_id'             => 'nullable|exists:fee_types,id',
        ]);

        $rule->update($validated);

        return response()->json($rule);
    }

    // DELETE /api/consequence-rules/{id}
    public function destroy($id)
    {
        ConsequenceRule::findOrFail($id)->delete();
        return response()->json(['message' => 'Rule deleted']);
    }
}