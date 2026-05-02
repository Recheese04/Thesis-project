<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConsequenceService;
use Illuminate\Http\Request;

class ConsequenceController extends Controller
{
    protected $service;

    public function __construct(ConsequenceService $service)
    {
        $this->service = $service;
    }

    /**
     * Get financial consequences for a student.
     * 
     * GET /api/consequences/{user_id}/financial
     */
    public function financial($userId)
    {
        $data = $this->service->getStudentFinancialConsequences($userId);
        return response()->json($data);
    }

    /**
     * Get non-financial consequences for a student.
     * 
     * GET /api/consequences/{user_id}/non-financial
     */
    public function nonFinancial($userId)
    {
        $data = $this->service->getStudentNonFinancialConsequences($userId);
        return response()->json($data);
    }

    /**
     * Manually assign a consequence.
     * 
     * POST /api/consequences/assign
     */
    public function assign(Request $request)
    {
        $validated = $request->validate([
            'user_id'             => 'required|exists:users,id',
            'consequence_rule_id' => 'required|exists:consequence_rules,id',
            'event_id'            => 'nullable|exists:events,id',
        ]);

        try {
            $consequence = $this->service->assignConsequence(
                $validated['user_id'],
                $validated['consequence_rule_id'],
                $validated['event_id'] ?? null
            );

            return response()->json([
                'message' => 'Consequence assigned successfully',
                'data'    => $consequence
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error assigning consequence', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark a consequence as completed.
     * 
     * PATCH /api/consequences/{id}/complete
     */
    public function complete(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        try {
            $consequence = $this->service->markComplete($id, $validated['notes'] ?? null);
            return response()->json([
                'message' => 'Consequence marked as completed',
                'data'    => $consequence
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error completing consequence', 'error' => $e->getMessage()], 500);
        }
    }
}
