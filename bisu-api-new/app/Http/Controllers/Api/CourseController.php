<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class CourseController extends Controller
{
    // ── GET /api/courses ──────────────────────────────────────────────────
    public function index(Request $request)
    {
        try {
            $query = Course::with('college:id,name,code')
                ->withCount('users')
                ->orderBy('name', 'asc');

            if ($request->has('college_id') && $request->college_id != 'all') {
                $query->where('college_id', $request->college_id);
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            Log::error('Course index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/colleges/{collegeId}/courses ─────────────────────────────
    public function byCollege($collegeId)
    {
        try {
            $courses = Course::where('college_id', $collegeId)
                ->withCount('users')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($courses);
        } catch (\Exception $e) {
            Log::error('Course byCollege error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── POST /api/courses ─────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'college_id' => 'required|exists:colleges,id',
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50',
            ]);

            $course = Course::create($data);
            $course->load('college:id,name,code');
            $course->loadCount('users');

            return response()->json([
                'message' => 'Course has been created successfully!',
                'course' => $course
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Course store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/courses/{id} ─────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $course = Course::findOrFail($id);

            $data = $request->validate([
                'college_id' => 'required|exists:colleges,id',
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50',
            ]);

            $course->update($data);
            $course->load('college:id,name,code');
            $course->loadCount('users');

            return response()->json([
                'message' => 'Course has been updated successfully!',
                'course' => $course
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Course update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/courses/{id} ──────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $course = Course::withCount('users')->findOrFail($id);

            if ($course->users_count > 0) {
                return response()->json([
                    'message' => 'Cannot delete course with existing users.',
                    'users_count' => $course->users_count,
                ], 422);
            }

            $course->delete();

            return response()->json([
                'message' => 'Course deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Course delete error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting course',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
