<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class DepartmentController extends Controller
{
    // ── GET /api/departments ──────────────────────────────────────────────
    public function index()
    {
        try {
            // Check if Department model exists and has required methods
            $departments = Department::query()
                ->withCount(['students', 'organizations'])
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($departments);
        } catch (\Exception $e) {
            Log::error('Department index error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching departments',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    // ── GET /api/departments/{id} ─────────────────────────────────────────
    public function show($id)
    {
        try {
            $department = Department::withCount(['students', 'organizations'])
                ->findOrFail($id);

            return response()->json($department);
        } catch (\Exception $e) {
            Log::error('Department show error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Department not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // ── POST /api/departments ─────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:departments,code',
            ]);

            $department = Department::create($data);

            // Load counts after creation
            $department->loadCount(['students', 'organizations']);

            return response()->json([
                'message' => 'Department has been created successfully!',
                'department' => $department
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Department store error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error creating department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/departments/{id} ─────────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $department = Department::findOrFail($id);

            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('departments', 'code')->ignore($department->id)
                ],
            ]);

            $department->update($data);

            // Load counts after update
            $department->loadCount(['students', 'organizations']);

            return response()->json([
                'message' => 'Department has been updated successfully!',
                'department' => $department
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Department update error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error updating department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/departments/{id} ──────────────────────────────────────
    public function destroy($id)
    {
        try {
            $department = Department::withCount(['students', 'organizations'])->findOrFail($id);

            // Check if department has any students or organizations
            if ($department->students_count > 0 || $department->organizations_count > 0) {
                return response()->json([
                    'message' => 'Cannot delete department with existing students or organizations.',
                    'students_count' => $department->students_count,
                    'organizations_count' => $department->organizations_count,
                ], 422);
            }

            $department->delete();

            return response()->json([
                'message' => 'Department deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Department delete error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error deleting department',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}