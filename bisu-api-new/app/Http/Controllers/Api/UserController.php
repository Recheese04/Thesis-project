<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    // ── GET /api/users ─────────────────────────────────────────────────────
    public function index()
    {
        try {
            $users = User::with(['student.department', 'userType'])
                ->orderBy('email')
                ->get();

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('User index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/users/{id} ────────────────────────────────────────────────
    public function show($id)
    {
        try {
            $user = User::with(['student.department', 'userType'])
                ->findOrFail($id);

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('User show error: ' . $e->getMessage());
            return response()->json([
                'message' => 'User not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // ── POST /api/users ────────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            // Validate base user fields
            $userData = $request->validate([
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'user_type_id' => 'required|exists:user_types,id',
                'is_active' => 'nullable|boolean',
            ]);

            // If creating a student/member account
            if ($request->user_type_id == 3) {
                // Validate student fields
                $studentData = $request->validate([
                    'student_number' => 'required|string|unique:students,student_id',
                    'first_name' => 'required|string|max:255',
                    'middle_name' => 'nullable|string|max:255',
                    'last_name' => 'required|string|max:255',
                    'year_level' => 'required|string',
                    'department_id' => 'required|exists:departments,id',
                    'contact_number' => 'nullable|string|max:20',
                ]);

                // Create the student record first
                $student = Student::create([
                    'student_id' => $studentData['student_number'],
                    'first_name' => $studentData['first_name'],
                    'middle_name' => $studentData['middle_name'] ?? null,
                    'last_name' => $studentData['last_name'],
                    'year_level' => $studentData['year_level'],
                    'department_id' => $studentData['department_id'],
                    'course' => $request->course ?? null,
                    'contact_number' => $studentData['contact_number'] ?? null,
                ]);

                // Create user with student FK
                $user = User::create([
                    'email' => $userData['email'],
                    'password' => Hash::make($userData['password']),
                    'user_type_id' => $userData['user_type_id'],
                    'student_id' => $student->id, // FK to students.id
                    'is_active' => $userData['is_active'] ?? true,
                ]);
            } else {
                // Admin or Officer - no student record needed
                $user = User::create([
                    'email' => $userData['email'],
                    'password' => Hash::make($userData['password']),
                    'user_type_id' => $userData['user_type_id'],
                    'is_active' => $userData['is_active'] ?? true,
                ]);
            }

            // Load relationships
            $user->load(['student.department', 'userType']);

            return response()->json([
                'message' => 'User created successfully',
                'user' => $user
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('User store error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/users/{id} ────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $user = User::with('student')->findOrFail($id);

            // Validate base user fields
            $userData = $request->validate([
                'email' => 'required|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:6',
                'user_type_id' => 'required|exists:user_types,id',
                'is_active' => 'nullable|boolean',
            ]);

            // Update user fields
            $user->email = $userData['email'];
            if (!empty($userData['password'])) {
                $user->password = Hash::make($userData['password']);
            }
            $user->user_type_id = $userData['user_type_id'];
            $user->is_active = $userData['is_active'] ?? $user->is_active;

            // If this is a student/member account
            if ($request->user_type_id == 3) {
                $studentData = $request->validate([
                    'student_number' => 'required|string|unique:students,student_id,' . ($user->student_id ?? 'NULL') . ',id',
                    'first_name' => 'required|string|max:255',
                    'middle_name' => 'nullable|string|max:255',
                    'last_name' => 'required|string|max:255',
                    'year_level' => 'required|string',
                    'department_id' => 'required|exists:departments,id',
                    'contact_number' => 'nullable|string|max:20',
                ]);

                if ($user->student) {
                    // Update existing student
                    $user->student->update([
                        'student_id' => $studentData['student_number'],
                        'first_name' => $studentData['first_name'],
                        'middle_name' => $studentData['middle_name'] ?? null,
                        'last_name' => $studentData['last_name'],
                        'year_level' => $studentData['year_level'],
                        'department_id' => $studentData['department_id'],
                        'course' => $request->course ?? $user->student->course,
                        'contact_number' => $studentData['contact_number'] ?? null,
                    ]);
                } else {
                    // Create new student record
                    $student = Student::create([
                        'student_id' => $studentData['student_number'],
                        'first_name' => $studentData['first_name'],
                        'middle_name' => $studentData['middle_name'] ?? null,
                        'last_name' => $studentData['last_name'],
                        'year_level' => $studentData['year_level'],
                        'department_id' => $studentData['department_id'],
                        'course' => $request->course ?? null,
                        'contact_number' => $studentData['contact_number'] ?? null,
                    ]);
                    $user->student_id = $student->id;
                }
            } else {
                // If changing from student to admin/officer, keep student data but note the role change
                // You could optionally set student_id to null here if you want to break the link
            }

            $user->save();
            $user->load(['student.department', 'userType']);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $user
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('User update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/users/{id} ─────────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $user = User::with('student')->findOrFail($id);

            // Optionally delete associated student record
            if ($user->student) {
                // Check if student has attendance records
                if ($user->student->attendances()->count() > 0) {
                    return response()->json([
                        'message' => 'Cannot delete user with existing attendance records',
                    ], 422);
                }
                // Delete student record
                $user->student->delete();
            }

            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('User delete error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting user',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}