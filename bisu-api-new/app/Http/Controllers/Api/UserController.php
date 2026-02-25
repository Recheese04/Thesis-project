<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\MemberOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with(['student.department', 'userType'])
                ->orderBy('created_at', 'desc')
                ->get();

            $users->each(function ($user) {
                if ($user->student_id) {
                    $allMemberships = MemberOrganization::with('organization')
                        ->where('student_id', $user->student_id)
                        ->where('status', 'active')
                        ->get();
                    $user->setAttribute('all_memberships', $allMemberships);
                    $user->setAttribute('officer_membership', $allMemberships->first());
                } else {
                    $user->setAttribute('all_memberships', collect());
                    $user->setAttribute('officer_membership', null);
                }
            });

            return response()->json($users);

        } catch (\Exception $e) {
            Log::error('User index error: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['message' => 'Error fetching users', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with(['student.department', 'userType'])->findOrFail($id);

            if ($user->student_id) {
                $allMemberships = MemberOrganization::with('organization')
                    ->where('student_id', $user->student_id)
                    ->where('status', 'active')
                    ->get();
                $user->setAttribute('all_memberships', $allMemberships);
                $user->setAttribute('officer_membership', $allMemberships->first());
            } else {
                $user->setAttribute('all_memberships', collect());
                $user->setAttribute('officer_membership', null);
            }

            return response()->json($user);
        } catch (\Exception $e) {
            Log::error('User show error: ' . $e->getMessage());
            return response()->json(['message' => 'User not found', 'error' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request)
    {
        $needsStudent = in_array($request->user_type_id, ['2', 2, '3', 3]);
        $isOfficer    = in_array($request->user_type_id, ['2', 2]);
        $isStudent    = in_array($request->user_type_id, ['3', 3]);

        $rules = [
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:8',
            'user_type_id' => 'required|exists:user_types,id',
            'is_active'    => 'nullable|in:0,1',
        ];

        if ($needsStudent) {
            $rules += [
                'first_name'     => 'required|string|max:100',
                'middle_name'    => 'nullable|string|max:100',
                'last_name'      => 'required|string|max:100',
                'student_number' => 'required|string|max:50|unique:students,student_number',
                'department_id'  => 'required|exists:departments,id',
                'year_level'     => 'required|string|max:20',
                'contact_number' => 'nullable|string|max:20',
                'course'         => 'required|string|max:255',
            ];
        }

        if ($isOfficer || $isStudent) {
            $rules += [
                'org_memberships'                       => 'nullable|array',
                'org_memberships.*.organization_id'     => 'required|exists:organizations,id',
                'org_memberships.*.position'            => 'nullable|string|max:100',
            ];
        }

        if ($isOfficer) {
            $rules['org_memberships.*.org_role'] = 'required|in:officer,adviser';
        }

        try {
            $data = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $student = null;

            if ($needsStudent) {
                $student = Student::create([
                    'student_number' => $data['student_number'],
                    'first_name'     => $data['first_name'],
                    'middle_name'    => $data['middle_name'] ?? null,
                    'last_name'      => $data['last_name'],
                    'department_id'  => $data['department_id'],
                    'year_level'     => $data['year_level'],
                    'contact_number' => $data['contact_number'] ?? null,
                    'course'         => $data['course'],
                ]);
            }

            $user = User::create([
                'email'         => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'user_type_id'  => $data['user_type_id'],
                'student_id'    => $student?->id,
                'is_active'     => ($data['is_active'] ?? '1') == '1',
            ]);

            if ($student && !empty($data['org_memberships'])) {
                foreach ($data['org_memberships'] as $m) {
                    MemberOrganization::create([
                        'organization_id' => $m['organization_id'],
                        'student_id'      => $student->id,
                        'role'            => $isOfficer ? ($m['org_role'] ?? 'officer') : 'member',
                        'position'        => $m['position'] ?? null,
                        'status'          => 'active',
                        'joined_date'     => now()->toDateString(),
                    ]);
                }
            }

            DB::commit();
            $user->load(['student.department', 'userType']);

            return response()->json(['message' => 'Account has been created successfully!', 'user' => $user], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating account', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user         = User::with('student')->findOrFail($id);
        $needsStudent = in_array($request->user_type_id, ['2', 2, '3', 3]);
        $isOfficer    = in_array($request->user_type_id, ['2', 2]);
        $isStudent    = in_array($request->user_type_id, ['3', 3]);
        $studentRowId = $user->student?->id;

        $rules = [
            'email'        => "required|email|unique:users,email,{$user->id}",
            'password'     => 'nullable|string|min:8',
            'user_type_id' => 'required|exists:user_types,id',
            'is_active'    => 'nullable|in:0,1',
        ];

        if ($needsStudent) {
            $uniqueRule = $studentRowId
                ? "required|string|max:50|unique:students,student_number,{$studentRowId},id"
                : 'required|string|max:50|unique:students,student_number';

            $rules += [
                'first_name'     => 'required|string|max:100',
                'middle_name'    => 'nullable|string|max:100',
                'last_name'      => 'required|string|max:100',
                'student_number' => $uniqueRule,
                'department_id'  => 'required|exists:departments,id',
                'year_level'     => 'required|string|max:20',
                'contact_number' => 'nullable|string|max:20',
                'course'         => 'required|string|max:255',
            ];
        }

        if ($isOfficer || $isStudent) {
            $rules += [
                'org_memberships'                   => 'nullable|array',
                'org_memberships.*.organization_id' => 'required|exists:organizations,id',
                'org_memberships.*.position'        => 'nullable|string|max:100',
            ];
        }

        if ($isOfficer) {
            $rules['org_memberships.*.org_role'] = 'required|in:officer,adviser';
        }

        try {
            $data = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $student = $user->student;

            if ($needsStudent) {
                $studentData = [
                    'student_number' => $data['student_number'],
                    'first_name'     => $data['first_name'],
                    'middle_name'    => $data['middle_name'] ?? null,
                    'last_name'      => $data['last_name'],
                    'department_id'  => $data['department_id'],
                    'year_level'     => $data['year_level'],
                    'contact_number' => $data['contact_number'] ?? null,
                    'course'         => $data['course'],
                ];
                if ($student) {
                    $student->update($studentData);
                } else {
                    $student = Student::create($studentData);
                }
            }

            $userUpdate = [
                'email'        => $data['email'],
                'user_type_id' => $data['user_type_id'],
                'is_active'    => isset($data['is_active']) ? $data['is_active'] == '1' : $user->is_active,
                'student_id'   => $student?->id ?? $user->student_id,
            ];

            if (!empty($data['password'])) {
                $userUpdate['password_hash'] = Hash::make($data['password']);
            }

            $user->update($userUpdate);

            if ($student) {
                // Deactivate all existing memberships then re-create from submitted list
                MemberOrganization::where('student_id', $student->id)->update(['status' => 'inactive']);

                foreach ($data['org_memberships'] ?? [] as $m) {
                    MemberOrganization::updateOrCreate(
                        ['student_id' => $student->id, 'organization_id' => $m['organization_id']],
                        [
                            'role'        => $isOfficer ? ($m['org_role'] ?? 'officer') : 'member',
                            'position'    => $m['position'] ?? null,
                            'status'      => 'active',
                            'joined_date' => now()->toDateString(),
                        ]
                    );
                }
            }

            DB::commit();
            $user->load(['student.department', 'userType']);

            return response()->json(['message' => 'Account has been updated successfully!', 'user' => $user]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User update error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating account', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $user    = User::with('student')->findOrFail($id);
            $student = $user->student;

            if ($student) {
                MemberOrganization::where('student_id', $student->id)->delete();
            }

            $user->tokens()->delete();
            $user->delete();

            if ($student) {
                $student->delete();
            }

            DB::commit();
            return response()->json(['message' => 'Account deleted successfully.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User delete error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting account', 'error' => $e->getMessage()], 500);
        }
    }
}