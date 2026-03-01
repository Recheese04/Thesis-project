<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserTypeController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\MemberOrganizationController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\GroupChatController;
use App\Http\Controllers\Api\ConsequenceRuleController;
use App\Http\Controllers\Api\ClearanceController;
use App\Http\Controllers\Api\TaskController;
use App\Models\Student;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // User Management
    Route::get('/users',         [UserController::class, 'index']);
    Route::get('/users/{id}',    [UserController::class, 'show']);
    Route::post('/users',        [UserController::class, 'store']);
    Route::put('/users/{id}',    [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Students
    Route::get('/students', function () {
        try {
            $query = Student::with([
                'department:id,name,code',
                'user:id,email,is_active'
            ])->select('id', 'student_id', 'first_name', 'last_name', 'year_level', 'department_id', 'course');

            return $query
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($student) {
                    return [
                        'id'            => $student->id,
                        'name'          => trim($student->first_name . ' ' . $student->last_name),
                        'first_name'    => $student->first_name,
                        'last_name'     => $student->last_name,
                        'student_id'    => $student->student_id,
                        'email'         => $student->user->email ?? null,
                        'year_level'    => $student->year_level,
                        'department_id' => $student->department_id,
                        'course'        => $student->course ?? null,
                        'is_active'     => $student->user->is_active ?? true,
                        'department'    => $student->department ? [
                            'id'   => $student->department->id,
                            'name' => $student->department->name,
                            'code' => $student->department->code ?? null,
                        ] : null,
                        'program'       => $student->course ? [
                            'id'   => null,
                            'name' => $student->course,
                            'code' => null,
                        ] : null,
                    ];
                });
        } catch (\Exception $e) {
            \Log::error('Students API error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to load students',
                'message' => $e->getMessage()
            ], 500);
        }
    });

    // User Types
    Route::get('/user-types', [UserTypeController::class, 'index']);

    // Department Management
    Route::get('/departments',         [DepartmentController::class, 'index']);
    Route::get('/departments/{id}',    [DepartmentController::class, 'show']);
    Route::post('/departments',        [DepartmentController::class, 'store']);
    Route::put('/departments/{id}',    [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

    // Organization Management
    Route::get('/organizations',         [OrganizationController::class, 'index']);
    Route::get('/organizations/{id}',    [OrganizationController::class, 'show']);
    Route::post('/organizations',        [OrganizationController::class, 'store']);
    Route::put('/organizations/{id}',    [OrganizationController::class, 'update']);
    Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);

    // Organization Members
    Route::get('/organizations/{org_id}/students/search',               [MemberOrganizationController::class, 'searchStudents']);
    Route::get('/organizations/{org_id}/members',                       [MemberOrganizationController::class, 'index']);
    Route::post('/organizations/{org_id}/members',                      [MemberOrganizationController::class, 'store']);
    Route::patch('/organizations/{org_id}/members/{membershipId}/role', [MemberOrganizationController::class, 'updateRole']);
    Route::delete('/organizations/{org_id}/members/{membershipId}',     [MemberOrganizationController::class, 'destroy']);

    // Consequence Rules
    Route::get('/organizations/{orgId}/consequence-rules',    [ConsequenceRuleController::class, 'index']);
    Route::post('/organizations/{orgId}/consequence-rules',   [ConsequenceRuleController::class, 'store']);
    Route::put('/consequence-rules/{id}',                     [ConsequenceRuleController::class, 'update']);
    Route::delete('/consequence-rules/{id}',                  [ConsequenceRuleController::class, 'destroy']);

    // Clearance Requirements
    Route::get('/organizations/{orgId}/clearance-requirements',  [ClearanceController::class, 'getRequirements']);
    Route::post('/organizations/{orgId}/clearance-requirements', [ClearanceController::class, 'storeRequirement']);

    // Clearance Status
    Route::get('/students/{studentId}/clearance',                                [ClearanceController::class, 'getStudentClearance']);
    Route::get('/organizations/{orgId}/clearance',                               [ClearanceController::class, 'getOrgClearance']);
    Route::post('/clearance/{requirementId}/students/{studentId}/clear',         [ClearanceController::class, 'clearRequirement']);
    Route::post('/clearance/{requirementId}/students/{studentId}/reject',        [ClearanceController::class, 'rejectRequirement']);

    // Tasks
    Route::get('/organizations/{orgId}/tasks',   [TaskController::class, 'index']);
    Route::post('/organizations/{orgId}/tasks',  [TaskController::class, 'store']);
    Route::put('/tasks/{id}/complete',           [TaskController::class, 'markComplete']);
    Route::put('/tasks/{id}',                    [TaskController::class, 'update']);
    Route::delete('/tasks/{id}',                 [TaskController::class, 'destroy']);

    // Event Management
    // ⚠️ Static routes MUST come before {id} wildcard routes
    Route::get('/events',            [EventController::class, 'index']);
    Route::post('/events',           [EventController::class, 'store']);
    Route::get('/events/upcoming',   [EventController::class, 'upcoming']);
    Route::get('/events/debug-time', [EventController::class, 'debugTime']);

    // Evaluation routes nested under events (static, before {id})
    Route::get('/events/{eventId}/evaluation',         [EvaluationController::class, 'getByEvent']);
    Route::post('/events/{eventId}/evaluation/submit', [EvaluationController::class, 'submit']);

    // Event close
    Route::post('/events/{eventId}/close', [TaskController::class, 'closeEvent']);

    // Event CRUD (wildcard — must be after static routes)
    Route::get('/events/{id}',    [EventController::class, 'show']);
    Route::put('/events/{id}',    [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::get('/events/{id}/qr', [EventController::class, 'getQRCode']);

    // Attendance
    Route::post('attendance/checkin',         [AttendanceController::class, 'checkIn']);
    Route::post('attendance/checkout',        [AttendanceController::class, 'checkOut']);
    Route::get('attendance/my',               [AttendanceController::class, 'getMyAttendance']);
    Route::get('attendance/status/{eventId}', [AttendanceController::class, 'getCurrentStatus']);
    Route::get('attendance/event/{eventId}',  [AttendanceController::class, 'getEventAttendance']);
    Route::post('attendance/manual-checkin',  [AttendanceController::class, 'manualCheckIn']);
    Route::post('attendance/manual-checkout', [AttendanceController::class, 'manualCheckOut']);
    Route::delete('attendance/{id}', function ($id) {
        \App\Models\Attendance::findOrFail($id)->delete();
        return response()->json(['message' => 'Record deleted.']);
    });

    // Evaluations
    Route::get('/evaluations',                 [EvaluationController::class, 'index']);
    Route::post('/evaluations',                [EvaluationController::class, 'store']);
    Route::get('/evaluations/{id}',            [EvaluationController::class, 'show']);
    Route::put('/evaluations/{id}',            [EvaluationController::class, 'update']);
    Route::delete('/evaluations/{id}',         [EvaluationController::class, 'destroy']);
    Route::get('/evaluations/{id}/results',    [EvaluationController::class, 'results']);
    Route::post('/evaluations/{id}/questions', [EvaluationController::class, 'addQuestions']);
    Route::post('/evaluations/{id}/responses', [EvaluationController::class, 'submitResponse']);

    // Officer & Student specific
    Route::get('/officer/events',      [EvaluationController::class, 'officerEvents']);
    Route::get('/student/evaluations', [EvaluationController::class, 'studentEvaluations']);

    // Messages (DMs + Org group chat)
    // ⚠️ /messages/members MUST come before /messages
    Route::get('/messages/members', [MessageController::class, 'members']);
    Route::get('/messages',         [MessageController::class, 'index']);
    Route::post('/messages',        [MessageController::class, 'store']);

    // Group Chats (custom groups)
    Route::prefix('group-chats')->group(function () {
        Route::get('/',                         [GroupChatController::class, 'index']);
        Route::post('/',                        [GroupChatController::class, 'store']);
        Route::patch('/{gc}',                   [GroupChatController::class, 'update']);
        Route::get('/{gc}/messages',            [GroupChatController::class, 'messages']);
        Route::post('/{gc}/messages',           [GroupChatController::class, 'sendMessage']);
        Route::post('/{gc}/members',            [GroupChatController::class, 'addMembers']);
        Route::delete('/{gc}/members/{userId}', [GroupChatController::class, 'removeMember']);
    });

    // AI Summarize
    Route::post('/summarize', function (Request $request) {
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . env('HF_TOKEN'),
                'Content-Type'  => 'application/json',
            ])->timeout(30)->post('https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn', [
                'inputs'     => $request->input('inputs'),
                'parameters' => [
                    'max_length' => 180,
                    'min_length' => 60,
                    'do_sample'  => false,
                ],
            ]);
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

});