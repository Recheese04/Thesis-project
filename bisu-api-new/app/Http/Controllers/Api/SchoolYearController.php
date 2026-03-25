<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolYear;
use Illuminate\Http\Request;

class SchoolYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(SchoolYear::orderBy('name', 'desc')->get());
    }

    /**
     * Get the active school year.
     */
    public function getActive()
    {
        $active = SchoolYear::where('is_active', true)->first();
        return response()->json($active);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:school_years,name',
            'is_active' => 'boolean',
        ]);

        if ($validated['is_active'] ?? false) {
            SchoolYear::where('is_active', true)->update(['is_active' => false]);
        }

        $schoolYear = SchoolYear::create($validated);

        return response()->json($schoolYear, 201);
    }

    /**
     * Mark a specific school year as active.
     */
    public function markActive($id)
    {
        SchoolYear::where('is_active', true)->update(['is_active' => false]);
        $schoolYear = SchoolYear::findOrFail($id);
        $schoolYear->update(['is_active' => true]);

        return response()->json(['message' => 'School year marked as active', 'school_year' => $schoolYear]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $schoolYear = SchoolYear::findOrFail($id);
        if ($schoolYear->is_active) {
            return response()->json(['message' => 'Cannot delete active school year'], 422);
        }
        $schoolYear->delete();
        return response()->json(['message' => 'School year deleted']);
    }
}
