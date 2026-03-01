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
            'event_category'          => 'nullable|string|max:100',
            'consequence_title'       => 'required|string|max:255',
            'consequence_description' => 'nullable|string',
            'due_days'                => 'required|integer|min:1',
        ]);

        $rule = ConsequenceRule::create([
            ...$validated,
            'organization_id' => $orgId,
            'created_by'      => Auth::id(),
        ]);

        return response()->json($rule, 201);
    }

    // PUT /api/consequence-rules/{id}
    public function update(Request $request, $id)
    {
        $rule = ConsequenceRule::findOrFail($id);

        $validated = $request->validate([
            'event_id'                => 'nullable|exists:events,id',
            'event_category'          => 'nullable|string|max:100',
            'consequence_title'       => 'required|string|max:255',
            'consequence_description' => 'nullable|string',
            'due_days'                => 'required|integer|min:1',
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