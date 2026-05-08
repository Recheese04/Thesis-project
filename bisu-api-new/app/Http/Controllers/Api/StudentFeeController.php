<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentFee;
use App\Models\FeeType;
use Illuminate\Http\Request;

class StudentFeeController extends Controller
{
    public function index(Request $request, $orgId)
    {
        $fees = StudentFee::with(['user', 'feeType'])
            ->where('organization_id', $orgId)
            ->get();

        return response()->json($fees);
    }

    public function store(Request $request, $orgId)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'status' => 'nullable|string',
        ]);

        $validated['organization_id'] = $orgId;
        
        $fee = StudentFee::create($validated);

        return response()->json([
            'message' => 'Fee assigned to student successfully.',
            'fee' => $fee->load(['user', 'feeType'])
        ], 201);
    }

    public function updateStatus(Request $request, $feeId)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,paid',
        ]);

        $fee = StudentFee::findOrFail($feeId);
        $fee->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Fee status updated successfully.']);
    }

    // New helper: Bulk assign a fee type to all active members of an organization
    public function bulkAssign(Request $request, $orgId)
    {
        $user = $request->user();
        
        // 1. Authorization: Only officers of this org can trigger bulk billing
        if (!$user->isOfficerOf($orgId)) {
            return response()->json(['message' => 'Unauthorized. Only officers can trigger bulk billing.'], 403);
        }

        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
        ]);

        $org = \App\Models\Organization::findOrFail($orgId);
        
        // 2. Selection: Get all users with any active designation in this org
        // (Usually includes both officers and members)
        $userIds = $org->members()
            ->where('status', 'active')
            ->distinct()
            ->pluck('user_id');

        if ($userIds->isEmpty()) {
            return response()->json(['message' => 'No active members found in this organization.'], 422);
        }

        $count = 0;
        foreach ($userIds as $userId) {
            // Check if already assigned to prevent duplicates
            $created = StudentFee::firstOrCreate([
                'organization_id' => $orgId,
                'user_id' => $userId,
                'fee_type_id' => $validated['fee_type_id']
            ], [
                'status' => 'pending'
            ]);
            
            if ($created->wasRecentlyCreated) {
                $count++;
            }
        }

        return response()->json([
            'message' => "Fee assigned to $count new members (" . count($userIds) . " total checked)."
        ]);
    }

    public function pay(Request $request, $feeId)
    {
        $validated = $request->validate([
            'payment_method_id' => 'required|exists:payment_methods,id',
            'reference_number' => 'required|string|max:255',
            'proof' => 'required|image|mimes:jpeg,png,webp,jpg|max:5120',
        ]);

        $fee = StudentFee::findOrFail($feeId);
        
        // Authorization: Ensure the fee belongs to the user (or admin/officer override)
        if ($fee->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($fee->proof) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($fee->proof);
        }

        $path = $request->file('proof')->store('proofs', 'public');
        
        $fee->update([
            'payment_method_id' => $validated['payment_method_id'],
            'reference_number' => $validated['reference_number'],
            'proof' => $path,
            'status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Payment submitted successfully. Please wait for officer approval.',
            'fee' => $fee->load(['feeType', 'paymentMethod'])
        ]);
    }
}
