<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserTypeController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\DesignationController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\GroupChatController;
use App\Http\Controllers\Api\ConsequenceRuleController;
use App\Http\Controllers\Api\ClearanceController;
use App\Http\Controllers\Api\SchoolYearController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ChatbotController;
use App\Models\Designation;
use App\Models\User;

Route::post('/login', [AuthController::class , 'login']);

// TEMPORARY DEBUG: Check user existence and password hash (REMOVE AFTER FIXING)
Route::any('/debug-user', function() {
    $email = request('email', 'rechiejames4@gmail.com');
    $user = \App\Models\User::where('email', $email)->first();
    if (!$user) {
        return response()->json(['error' => 'User not found', 'email' => $email]);
    }
    $hashStart = substr($user->password_hash ?? 'NULL', 0, 20);
    $checkResult = \Illuminate\Support\Facades\Hash::check('password', $user->password_hash ?? '');
    return response()->json([
        'user_found' => true,
        'email' => $user->email,
        'hash_preview' => $hashStart . '...',
        'password_check' => $checkResult ? 'MATCH' : 'NO MATCH',
        'hash_column' => $user->password_hash ? 'has value' : 'NULL or empty',
    ]);
});


Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/me', [AuthController::class , 'me']);

    // Student Profile
    Route::put('/profile', function (Request $request) {
            $user = $request->user();
            $data = $request->validate([
                'email' => "required|email|unique:users,email,{$user->id}",
                'contact_number' => 'nullable|string|max:20',
            ]);
            $user->update([
                'email' => $data['email'],
                'contact_number' => $data['contact_number'] ?? null,
            ]);
            return response()->json(['message' => 'Profile updated successfully.']);
        }
        );

        Route::post('/profile/password', function (Request $request) {
            $user = $request->user();
            $data = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
                'new_password_confirmation' => 'required|string',
            ]);

            \Illuminate\Support\Facades\Log::info('Password check attempt', [
                'provided' => $data['current_password'],
                'actual_hash' => $user->getAuthPassword() ?? 'NULL',
                'is_valid' => \Illuminate\Support\Facades\Hash::check($data['current_password'], $user->getAuthPassword())
            ]);

            if (!\Illuminate\Support\Facades\Hash::check($data['current_password'], $user->getAuthPassword())) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
            $user->update(['password_hash' => \Illuminate\Support\Facades\Hash::make($data['new_password'])]);
            return response()->json(['message' => 'Password changed successfully.']);
        }
        );

        Route::get('/profile/my-organizations', function (Request $request) {
            $user = $request->user();
            if (!$user->student_number)
                return response()->json([]);
            return Designation::with('organization')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get();
        }
        );

        Route::get('/profile/join-requests', function (Request $request) {
            $user = $request->user();
            if (!$user->student_number)
                return response()->json([]);
            return Designation::with('organization')
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->get();
        }
        );

        // ── Profile Picture ──────────────────────────────────────────────────
        Route::post('/profile/avatar', function (Request $request) {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,webp,jpg|max:2048',
            ]);

            $user = $request->user();
            if (!$user->student_number) {
                return response()->json(['message' => 'Only students can upload a profile picture.'], 403);
            }

            // Delete previous file if exists
            if ($user->profile_picture) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile_picture);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['profile_picture' => $path]);

            return response()->json([
            'message' => 'Profile picture updated.',
            'url' => \Illuminate\Support\Facades\Storage::disk('public')->url($path),
            ]);
        }
        );

        Route::delete('/profile/avatar', function (Request $request) {
            $user = $request->user();
            if (!$user->student_number) {
                return response()->json(['message' => 'Only students have profile pictures.'], 403);
            }

            if ($user->profile_picture) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile_picture);
                $user->update(['profile_picture' => null]);
            }

            return response()->json(['message' => 'Profile picture removed.']);
        }
        );

        Route::post('/profile/join-by-code', function (Request $request) {
            $user = $request->user();
            if (!$user->student_number) {
                return response()->json(['message' => 'Only students can join organizations.'], 403);
            }
            
            $request->validate(['invite_code' => 'required|string']);
            
            $org = \App\Models\Organization::where('invite_code', strtoupper($request->invite_code))->first();
            if (!$org) {
                return response()->json(['message' => 'Invalid or expired invite code.'], 404);
            }

            $exists = \App\Models\Designation::where('user_id', $user->id)
                ->where('organization_id', $org->id)
                ->whereIn('status', ['active', 'pending'])
                ->exists();
                
            if ($exists) {
                return response()->json(['message' => 'You already have an active or pending membership in this organization.'], 422);
            }
            
            \App\Models\Designation::create([
                'user_id' => $user->id,
                'organization_id' => $org->id,
                'designation' => 'Member',
                'status' => 'active', 
                'joined_date' => now()->toDateString(),
            ]);
            
            return response()->json([
                'message' => 'Successfully joined ' . $org->name . '!',
                'organization' => $org
            ]);
        });

        Route::delete('/profile/organizations/{orgId}/leave', function (Request $request, $orgId) {
            $user = $request->user();
            if (!$user->student_number) {
                return response()->json(['message' => 'Only students can leave organizations.'], 403);
            }

            $membership = \App\Models\Designation::where('user_id', $user->id)
                ->where('organization_id', $orgId)
                ->first();

            if (!$membership) {
                return response()->json(['message' => 'You are not a member of this organization.'], 404);
            }

            // Delete the membership record entirely to cleanly leave the organization
            $membership->delete();

            return response()->json(['message' => 'You have successfully left the organization.']);
        });

        Route::post('/organizations/{orgId}/join-request', function (Request $request, $orgId) {
            $user = $request->user();
            if (!$user->student_number) {
                return response()->json(['message' => 'Only students can join organizations.'], 403);
            }
            $exists = Designation::where('user_id', $user->id)
                ->where('organization_id', $orgId)
                ->whereIn('status', ['active', 'pending'])
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'You already have an active or pending membership.'], 422);
            }
            Designation::create([
                'user_id' => $user->id,
                'organization_id' => $orgId,
                'designation' => 'Member',
                'status' => 'pending',
                'joined_date' => now()->toDateString(),
            ]);
            return response()->json(['message' => 'Join request sent! Waiting for officer approval.']);
        }
        );
        // User Management
        Route::get('/users', [UserController::class , 'index']);
        Route::get('/users/{id}', [UserController::class , 'show']);
        Route::post('/users', [UserController::class , 'store']);
        Route::put('/users/{id}', [UserController::class , 'update']);
        Route::delete('/users/{id}', [UserController::class , 'destroy']);

        Route::delete('/users/{id}', [UserController::class , 'destroy']);
        Route::post('/users/import', [UserController::class , 'importStudents']);

        // School Years
        Route::get('/school-years', [SchoolYearController::class, 'index']);
        Route::get('/school-years/active', [SchoolYearController::class, 'getActive']);
        Route::post('/school-years', [SchoolYearController::class, 'store']);
        Route::post('/school-years/{id}/mark-active', [SchoolYearController::class, 'markActive']);
        Route::delete('/school-years/{id}', [SchoolYearController::class, 'destroy']);

        // Dashboard Stats
        Route::get('/dashboard/admin-stats', [DashboardController::class, 'adminStats']);
        Route::get('/dashboard/officer-stats', [DashboardController::class, 'officerStats']);

        // Students
        Route::get('/students', function () {
            try {
                $query = User::whereNotNull('student_number')
                    ->with('department:id,name,code')
                    ->select('id', 'student_number', 'first_name', 'last_name', 'year_level', 'department_id', 'course', 'email', 'is_active');

                if (request()->has('year_level') && request()->year_level != 'all') {
                    $query->where('year_level', request()->year_level);
                }

                return $query
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($user) {
                            return [
                            'id' => $user->id,
                            'name' => trim($user->first_name . ' ' . $user->last_name),
                            'first_name' => $user->first_name,
                            'last_name' => $user->last_name,
                            'student_id' => $user->student_number,
                            'email' => $user->email,
                            'year_level' => $user->year_level,
                            'department_id' => $user->department_id,
                            'course' => $user->course ?? null,
                            'is_active' => $user->is_active ?? true,
                            'department' => $user->department ? [
                            'id' => $user->department->id,
                            'name' => $user->department->name,
                            'code' => $user->department->code ?? null,
                            ] : null,
                            'program' => $user->course ? [
                            'id' => null,
                            'name' => $user->course,
                            'code' => null,
                            ] : null,
                            ];
                        }
                        );
                    }
                    catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Students API error: ' . $e->getMessage());
                        return response()->json([
                        'error' => 'Failed to load students',
                        'message' => $e->getMessage()
                        ], 500);
                    }
                }
                );

                // User Types
                Route::get('/user-types', [UserTypeController::class , 'index']);

                // Department Management
                Route::get('/departments', [DepartmentController::class , 'index']);
                Route::get('/departments/{id}', [DepartmentController::class , 'show']);
                Route::post('/departments', [DepartmentController::class , 'store']);
                Route::put('/departments/{id}', [DepartmentController::class , 'update']);
                Route::delete('/departments/{id}', [DepartmentController::class , 'destroy']);

                // Organization Management
                Route::get('/organizations', [OrganizationController::class , 'index']);
                Route::get('/organizations/{id}', [OrganizationController::class , 'show']);
                Route::post('/organizations', [OrganizationController::class , 'store']);
                Route::put('/organizations/{id}', [OrganizationController::class , 'update']);
                Route::delete('/organizations/{id}', [OrganizationController::class , 'destroy']);

                // Organization Members (Designations)
                Route::get('/organizations/{org_id}/students/search', [DesignationController::class , 'searchStudents']);
                Route::get('/organizations/{org_id}/members', [DesignationController::class , 'index']);
                Route::post('/organizations/{org_id}/members', [DesignationController::class , 'store']);
                Route::patch('/organizations/{org_id}/members/{designationId}/role', [DesignationController::class , 'updateDesignation']);
                Route::put('/organizations/{org_id}/members/{designationId}', [DesignationController::class , 'updateDesignation']);
                Route::delete('/organizations/{org_id}/members/{designationId}', [DesignationController::class , 'destroy']);
                Route::get('/organizations/{org_id}/members/{userId}/attendance', [DesignationController::class , 'memberAttendance']);

                // Join Request Approvals
                Route::post('/organizations/{org_id}/members/{designationId}/approve', function (Request $request, $orgId, $designationId) {
            $user = $request->user();
            if (!$user->isOfficerOf($orgId)) {
                return response()->json(['message' => 'Unauthorized. Only officers of this organization can approve requests.'], 403);
            }
            $designation = Designation::where('organization_id', $orgId)->findOrFail($designationId);
            $designation->update(['status' => 'active', 'joined_date' => now()->toDateString()]);
            return response()->json(['message' => 'Join request approved.']);
        }
        );
        Route::post('/organizations/{org_id}/members/{designationId}/reject', function (Request $request, $orgId, $designationId) {
            $user = $request->user();
            if (!$user->isOfficerOf($orgId)) {
                return response()->json(['message' => 'Unauthorized. Only officers of this organization can reject requests.'], 403);
            }
            $designation = Designation::where('organization_id', $orgId)->findOrFail($designationId);
            $designation->update(['status' => 'rejected']);
            return response()->json(['message' => 'Join request rejected.']);
        }
        );

        // Consequence Rules
        Route::get('/organizations/{orgId}/consequence-rules', [ConsequenceRuleController::class , 'index']);
        Route::post('/organizations/{orgId}/consequence-rules', [ConsequenceRuleController::class , 'store']);
        Route::put('/consequence-rules/{id}', [ConsequenceRuleController::class , 'update']);
        Route::delete('/consequence-rules/{id}', [ConsequenceRuleController::class , 'destroy']);

        // Membership Fees
        Route::get('/organizations/{orgId}/membership-fees', [\App\Http\Controllers\Api\MembershipFeeController::class, 'index']);
        Route::post('/organizations/{orgId}/membership-fees', [\App\Http\Controllers\Api\MembershipFeeController::class, 'store']);
        Route::put('/membership-fees/{feeId}/status', [\App\Http\Controllers\Api\MembershipFeeController::class, 'updateStatus']);

        // Announcements
        Route::get('/organizations/{orgId}/announcements', [AnnouncementController::class, 'index']);
        Route::post('/organizations/{orgId}/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
        Route::patch('/announcements/{id}/pin', [AnnouncementController::class, 'togglePin']);
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

        // Documents
        Route::get('/organizations/{orgId}/documents', [DocumentController::class, 'index']);
        Route::post('/organizations/{orgId}/documents', [DocumentController::class, 'store']);
        Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
        Route::get('/documents/{id}/download', [DocumentController::class, 'download']);

        // Clearance Status
        Route::get('/students/{userId}/organizations', function ($userId) {
            try {
                $userId = (int)$userId;
                $designations = Designation::with(['organization'])
                    ->where('user_id', $userId)
                    ->where('status', 'active')
                    ->get();
                $orgs = $designations->map(function ($d) {
                            return [
                            'organization_id' => $d->organization_id,
                            'name' => $d->organization->name,
                            'designation' => $d->designation,
                            ];
                        }
                        );
                        return response()->json($orgs);
                    }
                    catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('myOrganizations error: ' . $e->getMessage());
                        return response()->json(['message' => 'Error fetching organizations', 'error' => $e->getMessage()], 500);
                    }
                }
                );


                // Event Management
                // ⚠️ Static routes MUST come before {id} wildcard routes
                Route::get('/events', [EventController::class , 'index']);
                Route::post('/events', [EventController::class , 'store']);
                Route::get('/events/upcoming', [EventController::class , 'upcoming']);
                Route::get('/events/debug-time', [EventController::class , 'debugTime']);

                // Evaluation routes nested under events (static, before {id})
                Route::get('/events/{eventId}/evaluation', [EvaluationController::class , 'getByEvent']);
                Route::post('/events/{eventId}/evaluation/submit', [EvaluationController::class , 'submit']);

                // Event close
                Route::post('/events/{eventId}/close', [EventController::class , 'closeEvent']);

                // Event CRUD (wildcard — must be after static routes)
                Route::get('/events/{id}', [EventController::class , 'show']);
                Route::put('/events/{id}', [EventController::class , 'update']);
                Route::delete('/events/{id}', [EventController::class , 'destroy']);
                Route::get('/events/{id}/qr', [EventController::class , 'getQRCode']);

                // Attendance
                Route::post('attendance/checkin', [AttendanceController::class , 'checkIn']);
                Route::post('attendance/checkout', [AttendanceController::class , 'checkOut']);
                Route::get('attendance/my', [AttendanceController::class , 'getMyAttendance']);
                Route::get('attendance/status/{eventId}', [AttendanceController::class , 'getCurrentStatus']);
                Route::get('attendance/event/{eventId}', [AttendanceController::class , 'getEventAttendance']);
                Route::post('attendance/manual-checkin', [AttendanceController::class , 'manualCheckIn']);
                Route::post('attendance/manual-checkout', [AttendanceController::class , 'manualCheckOut']);
                Route::post('attendance/rfid-checkin', [AttendanceController::class , 'rfidCheckIn']);
                Route::post('attendance/rfid-checkout', [AttendanceController::class , 'rfidCheckOut']);
                Route::post('attendance/rfid-scan', [AttendanceController::class , 'rfidScan']); // smart auto-detect
                Route::put('/students/{id}/rfid', [UserController::class , 'updateRfidUid']);
                Route::delete('attendance/{id}', function (\Illuminate\Http\Request $request, $id) {
            $user = $request->user();
            $attendance = \App\Models\Attendance::with('event')->findOrFail($id);
            if (!$attendance->event || !$user->isOfficerOf($attendance->event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. You can only delete attendance records for your organization.'], 403);
            }
            $attendance->delete();
            return response()->json(['message' => 'Record deleted.']);
        }
        );

        // Evaluations
        Route::get('/evaluations', [EvaluationController::class , 'index']);
        Route::post('/evaluations', [EvaluationController::class , 'store']);
        Route::get('/evaluations/{id}', [EvaluationController::class , 'show']);
        Route::put('/evaluations/{id}', [EvaluationController::class , 'update']);
        Route::delete('/evaluations/{id}', [EvaluationController::class , 'destroy']);
        Route::get('/evaluations/{id}/results', [EvaluationController::class , 'results']);
        Route::post('/evaluations/{id}/questions', [EvaluationController::class , 'addQuestions']);
        Route::post('/evaluations/{id}/responses', [EvaluationController::class , 'submitResponse']);

        // Officer & Student specific
        Route::get('/officer/events', [EvaluationController::class , 'officerEvents']);
        Route::get('/student/evaluations', [EvaluationController::class , 'studentEvaluations']);
        Route::get('/student/announcements', [AnnouncementController::class, 'studentIndex']);
        Route::get('/student/documents', [DocumentController::class, 'studentIndex']);

        // Messages (DMs + Org group chat)
        // ⚠️ /messages/members MUST come before /messages
        Route::get('/messages/members', [MessageController::class , 'members']);
        Route::get('/messages', [MessageController::class , 'index']);
        Route::post('/messages', [MessageController::class , 'store']);
        Route::patch('/messages/{id}', [MessageController::class , 'update']);
        Route::delete('/messages/{id}', [MessageController::class , 'destroy']);

        // Group Chats (custom groups)
        Route::prefix('group-chats')->group(function () {
            Route::get('/', [GroupChatController::class , 'index']);
            Route::post('/', [GroupChatController::class , 'store']);
            Route::patch('/{gc}', [GroupChatController::class , 'update']);
            Route::get('/{gc}/messages', [GroupChatController::class , 'messages']);
            Route::post('/{gc}/messages', [GroupChatController::class , 'sendMessage']);
            Route::post('/{gc}/members', [GroupChatController::class , 'addMembers']);
            Route::delete('/{gc}/members/{userId}', [GroupChatController::class , 'removeMember']);
        });

        // AI Summarize (Gemini 1.5 Flash)
        Route::post('/summarize', [EvaluationController::class, 'summarize']);

        // AI Chatbot
        Route::post('/chatbot', [ChatbotController::class, 'handleChat']);
    });