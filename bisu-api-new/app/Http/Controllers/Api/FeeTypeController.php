<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use Illuminate\Http\Request;

class FeeTypeController extends Controller
{
    public function index(Request $request)
    {
        // For an officer, get all fee types for their organizations
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orgIds = $user->designations()
            ->where('status', 'active')
            ->whereNotIn('designation', ['Member', 'member'])
            ->pluck('organization_id');
            
        $query = FeeType::with(['creator', 'schoolYear']);

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        } else {
            $query->whereIn('organization_id', $orgIds);
        }

        if ($request->filled('school_year_id') && $request->school_year_id !== 'all') {
            $query->where('school_year_id', $request->school_year_id);
        }

        $fees = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['fees' => $fees]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'school_year_id' => 'nullable|exists:school_years,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'type' => 'nullable|string',
        ]);

        // Check if user is an officer of this org
        $isOfficer = $user->designations()
            ->where('organization_id', $validated['organization_id'])
            ->where('status', 'active')
            ->whereNotIn('designation', ['Member', 'member'])
            ->exists();

        if (!$isOfficer) {
            return response()->json(['message' => 'Unauthorized to create fees for this organization.'], 403);
        }

        $validated['created_by'] = $user->id;
        if (!isset($validated['type'])) {
            $validated['type'] = 'other';
        }

        if (empty($validated['school_year_id'])) {
            $activeYear = \App\Models\SchoolYear::where('is_active', true)->first();
            $validated['school_year_id'] = $activeYear?->id;
        }

        $fee = FeeType::create($validated);
        $fee->load('schoolYear');

        return response()->json(['message' => 'Fee type created successfully.', 'fee' => $fee], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $fee = FeeType::find($id);

        if (!$fee) {
            return response()->json(['message' => 'Fee not found'], 404);
        }

        // Check if user is an officer of the organization this fee belongs to
        $isOfficer = $user->designations()
            ->where('organization_id', $fee->organization_id)
            ->where('status', 'active')
            ->whereNotIn('designation', ['Member', 'member'])
            ->exists();

        if (!$isOfficer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'type' => 'nullable|string',
        ]);

        $fee->update($validated);

        return response()->json(['message' => 'Fee updated successfully.', 'fee' => $fee]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $fee = FeeType::find($id);

        if (!$fee) {
            return response()->json(['message' => 'Fee not found'], 404);
        }

        $isOfficer = $user->designations()
            ->where('organization_id', $fee->organization_id)
            ->where('status', 'active')
            ->whereNotIn('designation', ['Member', 'member'])
            ->exists();

        if (!$isOfficer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fee->delete();
        return response()->json(['message' => 'Fee deleted successfully']);
    }
}
