<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MembershipFee;
use App\Models\User;
use App\Models\Designation;

class MembershipFeeController extends Controller
{
    public function index($orgId, Request $request)
    {
        $schoolYear = $request->query('school_year_id');
        $semester = $request->query('semester');

        $members = Designation::with(['user' => function($q) {
            $q->select('id', 'first_name', 'last_name', 'student_number');
        }])
        ->where('organization_id', $orgId)
        ->where('status', 'active')
        ->get();

        $fees = MembershipFee::where('organization_id', $orgId)->get();
        $feesByUser = $fees->groupBy('user_id');
        
        $result = $members->map(function ($member) use ($feesByUser) {
            $userId = $member->user_id;
            $userFees = $feesByUser->get($userId, collect([]));
            
            return [
                'student_id' => $userId,
                'student_number' => $member->user->student_number ?? '',
                'student_name' => trim(($member->user->first_name ?? '') . ' ' . ($member->user->last_name ?? '')),
                'position' => $member->designation,
                'fees' => $userFees->map(function($fee) {
                    return [
                        'id' => $fee->id,
                        'name' => $fee->name,
                        'description' => $fee->description,
                        'amount' => $fee->amount,
                        'status' => $fee->status,
                        'proof' => $fee->proof,
                    ];
                })->values()->all(),
            ];
        });

        return response()->json($result->sortBy('student_name')->values()->all());
    }

    public function store($orgId, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $amount = $request->amount;
        $name = $request->name;
        $description = $request->description;

        $members = Designation::where('organization_id', $orgId)
            ->where('status', 'active')
            ->pluck('user_id');

        foreach ($members as $userId) {
            $fee = MembershipFee::firstOrNew([
                'organization_id' => $orgId, 
                'user_id' => $userId,
                'name' => $name
            ]);

            // If it's a new fee or currently pending, we can update it
            if (!$fee->exists || $fee->status === 'pending') {
                $fee->description = $description;
                $fee->amount = $amount;
                if (!$fee->exists) {
                    $fee->status = 'pending';
                }
                $fee->save();
            }
        }

        return response()->json(['message' => 'Membership fees generated for all active members.']);
    }

    public function updateStatus($feeId, Request $request)
    {
        $request->validate([
            'status' => 'required|in:pending,paid,rejected',
        ]);

        $fee = MembershipFee::findOrFail($feeId);
        $fee->status = $request->status;
        $fee->save();

        return response()->json([
            'message' => 'Fee status updated.',
            'fee' => $fee
        ]);
    }
}
