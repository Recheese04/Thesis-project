<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\College;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class CollegeController extends Controller
{
    // ── GET /api/colleges ─────────────────────────────────────────────────
    public function index()
    {
        try {
            $colleges = College::query()
                ->withCount(['users', 'organizations', 'courses'])
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($colleges);
        } catch (\Exception $e) {
            Log::error('College index error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error fetching colleges',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    // ── GET /api/colleges/{id} ────────────────────────────────────────────
    public function show($id)
    {
        try {
            $college = College::withCount(['users', 'organizations', 'courses'])
                ->with('courses')
                ->findOrFail($id);

            return response()->json($college);
        } catch (\Exception $e) {
            Log::error('College show error: ' . $e->getMessage());

            return response()->json([
                'message' => 'College not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // ── POST /api/colleges ────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:colleges,code',
            ]);

            $college = College::create($data);

            $college->loadCount(['users', 'organizations', 'courses']);

            return response()->json([
                'message' => 'College has been created successfully!',
                'college' => $college
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('College store error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error creating college',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/colleges/{id} ────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $college = College::findOrFail($id);

            $data = $request->validate([
                'name' => 'required|string|max:255',
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('colleges', 'code')->ignore($college->id)
                ],
            ]);

            $college->update($data);

            $college->loadCount(['users', 'organizations', 'courses']);

            return response()->json([
                'message' => 'College has been updated successfully!',
                'college' => $college
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('College update error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error updating college',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/colleges/{id} ─────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $college = College::withCount(['users', 'organizations'])->findOrFail($id);

            if ($college->users_count > 0 || $college->organizations_count > 0) {
                return response()->json([
                    'message' => 'Cannot delete college with existing users or organizations.',
                    'users_count' => $college->users_count,
                    'organizations_count' => $college->organizations_count,
                ], 422);
            }

            $college->delete();

            return response()->json([
                'message' => 'College deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('College delete error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Error deleting college',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
