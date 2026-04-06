<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with(['college', 'course', 'userType'])
                ->orderBy('created_at', 'desc')
                ->get();

            $users->each(function ($user) {
                if ($user->student_number) {
                    $allMemberships = Designation::with('organization')
                        ->where('user_id', $user->id)
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
            $user = User::with(['college', 'course', 'userType'])->findOrFail($id);

            if ($user->student_number) {
                $allMemberships = Designation::with('organization')
                    ->where('user_id', $user->id)
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
                'student_number' => 'required|string|max:50|unique:users,student_number',
                'college_id'  => 'required|exists:colleges,id',
                'year_level'     => 'required|string|max:20',
                'contact_number' => 'nullable|string|max:20',
                'course'         => 'required|string|max:255',
            ];
        }

        if ($isOfficer || $isStudent) {
            $rules += [
                'org_memberships'                       => 'nullable|array',
                'org_memberships.*.organization_id'     => 'required|exists:organizations,id',
                'org_memberships.*.designation'          => 'nullable|string|max:100',
            ];
        }

        // Designation is validated above as a string (e.g. President, Treasurer, Member)

        try {
            $data = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $userPayload = [
                'email'         => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'user_type_id'  => $data['user_type_id'],
                'is_active'     => ($data['is_active'] ?? '1') == '1',
            ];

            if ($needsStudent) {
                $userPayload['student_number'] = $data['student_number'];
                $userPayload['first_name']     = $data['first_name'];
                $userPayload['middle_name']    = $data['middle_name'] ?? null;
                $userPayload['last_name']      = $data['last_name'];
                $userPayload['college_id']  = $data['college_id'];
                $userPayload['year_level']     = $data['year_level'];
                $userPayload['contact_number'] = $data['contact_number'] ?? null;
                $userPayload['course']         = $data['course'];
            }

            $user = User::create($userPayload);

            if ($needsStudent && !empty($data['org_memberships'])) {
                foreach ($data['org_memberships'] as $m) {
                    Designation::create([
                        'organization_id' => $m['organization_id'],
                        'user_id'         => $user->id,
                        'designation'     => $m['designation'] ?? 'Member',
                        'status'          => 'active',
                        'joined_date'     => now()->toDateString(),
                    ]);
                }
            }

            DB::commit();
            $user->load(['college', 'course', 'userType']);

            return response()->json(['message' => 'Account has been created successfully!', 'user' => $user], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating account', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user         = User::findOrFail($id);
        $needsStudent = in_array($request->user_type_id, ['2', 2, '3', 3]);
        $isOfficer    = in_array($request->user_type_id, ['2', 2]);
        $isStudent    = in_array($request->user_type_id, ['3', 3]);

        $rules = [
            'email'        => "required|email|unique:users,email,{$user->id}",
            'password'     => 'nullable|string|min:8',
            'user_type_id' => 'required|exists:user_types,id',
            'is_active'    => 'nullable|in:0,1',
        ];

        if ($needsStudent) {
            $uniqueRule = "required|string|max:50|unique:users,student_number,{$user->id}";

            $rules += [
                'first_name'     => 'required|string|max:100',
                'middle_name'    => 'nullable|string|max:100',
                'last_name'      => 'required|string|max:100',
                'student_number' => $uniqueRule,
                'college_id'  => 'required|exists:colleges,id',
                'year_level'     => 'required|string|max:20',
                'contact_number' => 'nullable|string|max:20',
                'course'         => 'required|string|max:255',
            ];
        }

        if ($isOfficer || $isStudent) {
            $rules += [
                'org_memberships'                   => 'nullable|array',
                'org_memberships.*.organization_id' => 'required|exists:organizations,id',
                'org_memberships.*.designation'      => 'nullable|string|max:100',
            ];
        }

        // Designation is validated above as a string

        try {
            $data = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $userUpdate = [
                'email'        => $data['email'],
                'user_type_id' => $data['user_type_id'],
                'is_active'    => isset($data['is_active']) ? $data['is_active'] == '1' : $user->is_active,
            ];

            if ($needsStudent) {
                $userUpdate['student_number'] = $data['student_number'];
                $userUpdate['first_name']     = $data['first_name'];
                $userUpdate['middle_name']    = $data['middle_name'] ?? null;
                $userUpdate['last_name']      = $data['last_name'];
                $userUpdate['college_id']  = $data['college_id'];
                $userUpdate['year_level']     = $data['year_level'];
                $userUpdate['contact_number'] = $data['contact_number'] ?? null;
                $userUpdate['course']         = $data['course'];
            }

            if (!empty($data['password'])) {
                $userUpdate['password_hash'] = Hash::make($data['password']);
            }

            $user->update($userUpdate);

            if ($needsStudent) {
                // Deactivate all existing memberships then re-create from submitted list
                Designation::where('user_id', $user->id)->update(['status' => 'inactive']);

                foreach ($data['org_memberships'] ?? [] as $m) {
                    Designation::updateOrCreate(
                        ['user_id' => $user->id, 'organization_id' => $m['organization_id']],
                        [
                            'designation'  => $m['designation'] ?? 'Member',
                            'status'       => 'active',
                            'joined_date'  => now()->toDateString(),
                        ]
                    );
                }
            }

            // Revoke active sessions so the user is forced to re-login with their newly updated role/designation
            $user->tokens()->delete();

            DB::commit();
            $user->load(['college', 'course', 'userType']);

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
            $user = User::findOrFail($id);

            Designation::where('user_id', $user->id)->delete();
            $user->tokens()->delete();
            $user->delete();

            DB::commit();
            return response()->json(['message' => 'Account deleted successfully.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User delete error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting account', 'error' => $e->getMessage()], 500);
        }
    }

    //  POST /api/users/import  Bulk import students from CSV 
    public function importStudents(Request $request)
    {
        $request->validate([
            'students'                  => 'required|array|min:1|max:500',
            'students.*.student_number' => 'required|string|max:50',
            'students.*.first_name'     => 'required|string|max:100',
            'students.*.middle_name'    => 'nullable|string|max:100',
            'students.*.last_name'      => 'required|string|max:100',
            'students.*.email'          => 'required|email|max:255',
            'students.*.college_id'  => 'required|integer|exists:colleges,id',
            'students.*.course'         => 'required|string|max:255',
            'students.*.year_level'     => 'required|string|max:20',
            'students.*.contact_number' => 'nullable|string|max:20',
        ]);

        $rows    = $request->students;
        $created = 0;
        $skipped = [];
        $errors  = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $i => $row) {
                $rowNum = $i + 1;

                if (User::where('email', $row['email'])->exists()) {
                    $skipped[] = ['row' => $rowNum, 'reason' => "Email {$row['email']} already exists"];
                    continue;
                }

                if (User::where('student_number', $row['student_number'])->exists()) {
                    $skipped[] = ['row' => $rowNum, 'reason' => "Student # {$row['student_number']} already exists"];
                    continue;
                }

                try {
                    User::create([
                        'student_number' => $row['student_number'],
                        'first_name'     => $row['first_name'],
                        'middle_name'    => $row['middle_name'] ?? null,
                        'last_name'      => $row['last_name'],
                        'college_id'  => $row['college_id'],
                        'course'         => $row['course'],
                        'year_level'     => $row['year_level'],
                        'contact_number' => $row['contact_number'] ?? null,
                        'email'          => $row['email'],
                        'password_hash'  => Hash::make('bisu_' . $row['student_number']),
                        'user_type_id'   => 3,
                        'is_active'      => true,
                    ]);

                    $created++;
                } catch (\Exception $e) {
                    $errors[] = ['row' => $rowNum, 'reason' => $e->getMessage()];
                }
            }

            DB::commit();

            return response()->json([
                'message' => "{$created} student(s) imported successfully.",
                'created' => $created,
                'skipped' => $skipped,
                'errors'  => $errors,
                'total'   => count($rows),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User import error: ' . $e->getMessage());
            return response()->json(['message' => 'Import failed', 'error' => $e->getMessage()], 500);
        }
    }
}