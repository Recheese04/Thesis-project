<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function checkIn(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'qr_code' => 'required|string',
            ]);

            $event = Event::where('id', $data['event_id'])
                ->where('qr_code', $data['qr_code'])
                ->first();

            if (!$event) {
                return response()->json(['message' => 'Invalid QR code for this event'], 400);
            }

            $user = auth()->user();

            $existing = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $user->id)
                ->whereDate('time_in', today())
                ->where('status', 'checked_in')
                ->whereNull('time_out')
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Already checked in',
                    'attendance' => $existing->load('user', 'event'),
                ], 200);
            }

            $attendance = Attendance::create([
                'event_id' => $data['event_id'],
                'user_id' => $user->id,
                'attendance_type' => 'QR',
                'time_in' => now(),
                'status' => 'checked_in',
            ]);

            return response()->json([
                'message' => 'Checked in successfully!',
                'attendance' => $attendance->load('user', 'event'),
            ], 201);

        }
        catch (\Exception $e) {
            Log::error('Check-in error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking in', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkOut(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'qr_code' => 'required|string',
            ]);

            $event = Event::where('id', $data['event_id'])
                ->where('qr_code', $data['qr_code'])
                ->first();

            if (!$event) {
                return response()->json(['message' => 'Invalid QR code for this event'], 400);
            }

            $user = auth()->user();

            $attendance = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $user->id)
                ->where('status', 'checked_in')
                ->whereNull('time_out')
                ->orderBy('time_in', 'desc')
                ->first();

            if (!$attendance) {
                return response()->json(['message' => 'No active check-in found. Please check in first.'], 400);
            }

            $attendance->time_out = now();
            $attendance->status = 'checked_out';
            $attendance->save();

            return response()->json([
                'message' => 'Checked out successfully!',
                'attendance' => $attendance->load('user', 'event'),
                'duration' => $attendance->formatted_duration,
            ], 200);

        }
        catch (\Exception $e) {
            Log::error('Check-out error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking out', 'error' => $e->getMessage()], 500);
        }
    }

    public function getEventAttendance($eventId)
    {
        try {
            $event = Event::findOrFail($eventId);
            $authUser = auth()->user();
            if (!$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. You can only view attendance for your own events.'], 403);
            }

            $attendance = Attendance::with(['user.department'])
                ->where('event_id', $eventId)
                ->orderBy('time_in', 'desc')
                ->get()
                ->map(function ($record) {
                $user = $record->user;
                return [
                'id' => $record->id,
                'event_id' => $record->event_id,
                'attendance_type' => $record->attendance_type,
                'time_in' => $record->time_in,
                'time_out' => $record->time_out,
                'status' => $record->status,
                'remarks' => $record->remarks,
                'is_active' => $record->is_active,
                'formatted_duration' => $record->formatted_duration,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
                'user' => $user ? [
                'id' => $user->id,
                'name' => trim($user->first_name . ' ' . $user->last_name),
                'student_number' => $user->student_number,
                'year_level' => $user->year_level,
                'course' => $user->course ?? null,
                'department' => $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->name,
                ] : null,
                ] : null,
                ];
            });

            $stats = [
                'total' => $attendance->count(),
                'checked_in' => $attendance->where('status', 'checked_in')->count(),
                'checked_out' => $attendance->where('status', 'checked_out')->count(),
            ];

            return response()->json(['attendance' => $attendance, 'stats' => $stats]);

        }
        catch (\Exception $e) {
            Log::error('Get attendance error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching attendance', 'error' => $e->getMessage()], 500);
        }
    }

    public function getMyAttendance()
    {
        try {
            $user = auth()->user();

            $attendance = Attendance::with(['event.organization', 'user'])
                ->where('user_id', $user->id)
                ->orderBy('time_in', 'desc')
                ->get();

            return response()->json($attendance);

        }
        catch (\Exception $e) {
            Log::error('Get my attendance error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching attendance', 'error' => $e->getMessage()], 500);
        }
    }

    public function getCurrentStatus($eventId)
    {
        try {
            $user = auth()->user();

            $attendance = Attendance::where('event_id', $eventId)
                ->where('user_id', $user->id)
                ->orderBy('time_in', 'desc')
                ->first();

            if (!$attendance) {
                return response()->json(['status' => 'not_checked_in', 'message' => 'Not checked in']);
            }

            return response()->json([
                'status' => $attendance->status,
                'attendance' => $attendance,
                'is_active' => $attendance->is_active,
                'duration' => $attendance->formatted_duration,
            ]);

        }
        catch (\Exception $e) {
            Log::error('Get status error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching status', 'error' => $e->getMessage()], 500);
        }
    }

    public function manualCheckIn(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'user_id' => 'required|exists:users,id',
                'time_in' => 'nullable|date',
                'remarks' => 'nullable|string',
            ]);

            $authUser = auth()->user();
            $event = Event::findOrFail($data['event_id']);
            if (!$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. Only officers can perform manual check-in.'], 403);
            }

            $existing = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $data['user_id'])
                ->whereDate('time_in', today())
                ->where('status', 'checked_in')
                ->whereNull('time_out')
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'user_id' => ['This user is already checked in for this event today.'],
                ]);
            }

            $attendance = Attendance::create([
                'event_id' => $data['event_id'],
                'user_id' => $data['user_id'],
                'attendance_type' => 'manual',
                'time_in' => $data['time_in'] ?? now(),
                'status' => 'checked_in',
                'remarks' => $data['remarks'] ?? null,
            ]);

            return response()->json([
                'message' => 'Manual check-in recorded',
                'attendance' => $attendance->load('user', 'event'),
            ], 200);

        }
        catch (ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        }
        catch (\Exception $e) {
            Log::error('Manual check-in error: ' . $e->getMessage());
            return response()->json(['message' => 'Error recording check-in', 'error' => $e->getMessage()], 500);
        }
    }

    public function manualCheckOut(Request $request)
    {
        try {
            $data = $request->validate([
                'attendance_id' => 'required|exists:attendances,id',
                'time_out' => 'nullable|date',
                'remarks' => 'nullable|string',
            ]);

            $attendance = Attendance::with('event')->findOrFail($data['attendance_id']);
            $authUser = auth()->user();
            $event = $attendance->event;

            if (!$event || !$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. Only officers can perform manual check-out.'], 403);
            }

            if ($attendance->status === 'checked_out') {
                return response()->json(['message' => 'Already checked out'], 400);
            }

            $attendance->time_out = $data['time_out'] ?? now();
            $attendance->status = 'checked_out';
            if (isset($data['remarks'])) {
                $attendance->remarks = $data['remarks'];
            }
            $attendance->save();

            return response()->json([
                'message' => 'Manual check-out recorded',
                'attendance' => $attendance->load('user', 'event'),
                'duration' => $attendance->formatted_duration,
            ], 200);

        }
        catch (\Exception $e) {
            Log::error('Manual check-out error: ' . $e->getMessage());
            return response()->json(['message' => 'Error recording check-out', 'error' => $e->getMessage()], 500);
        }
    }

    // ── RFID Check-In ──────────────────────────────────────────────────────

    public function rfidCheckIn(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'rfid_uid' => 'required|string',
            ]);

            $user = User::where('rfid_uid', $data['rfid_uid'])->first();
            if (!$user) {
                return response()->json([
                    'message' => 'No user found with this RFID card.',
                    'rfid_uid' => $data['rfid_uid'],
                ], 404);
            }

            $event = Event::findOrFail($data['event_id']);

            // Authorization
            $authUser = auth()->user();
            if (!$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. You can only scan for your organization\'s events.'], 403);
            }

            $existing = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                if ($existing->status === 'checked_out') {
                    return response()->json([
                        'message' => 'Already checked out today',
                        'user_name' => trim($user->first_name . ' ' . $user->last_name),
                        'profile_picture_url' => $user->profile_picture_url,
                        'student_number' => $user->student_number,
                        'course' => $user->course,
                        'year_level' => $user->year_level,
                        'attendance' => $existing->load('user', 'event'),
                    ], 200);
                }

                return response()->json([
                    'message' => 'Already checked in',
                    'user_name' => trim($user->first_name . ' ' . $user->last_name),
                    'profile_picture_url' => $user->profile_picture_url,
                    'student_number' => $user->student_number,
                    'course' => $user->course,
                    'year_level' => $user->year_level,
                    'attendance' => $existing->load('user', 'event'),
                ], 200);
            }

            $attendance = Attendance::create([
                'event_id' => $data['event_id'],
                'user_id' => $user->id,
                'attendance_type' => 'RFID',
                'time_in' => now(),
                'status' => 'checked_in',
            ]);

            return response()->json([
                'message' => 'Checked in successfully!',
                'user_name' => trim($user->first_name . ' ' . $user->last_name),
                'profile_picture_url' => $user->profile_picture_url,
                'student_number' => $user->student_number,
                'course' => $user->course,
                'year_level' => $user->year_level,
                'attendance' => $attendance->load('user', 'event'),
            ], 201);

        }
        catch (\Exception $e) {
            Log::error('RFID check-in error: ' . $e->getMessage());
            return response()->json(['message' => 'Error during RFID check-in', 'error' => $e->getMessage()], 500);
        }
    }

    // ── RFID Check-Out ─────────────────────────────────────────────────────

    public function rfidCheckOut(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'rfid_uid' => 'required|string',
            ]);

            $user = User::where('rfid_uid', $data['rfid_uid'])->first();
            if (!$user) {
                return response()->json([
                    'message' => 'No user found with this RFID card.',
                    'rfid_uid' => $data['rfid_uid'],
                ], 404);
            }

            $event = Event::findOrFail($data['event_id']);

            $authUser = auth()->user();
            if (!$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $attendance = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$attendance || $attendance->status !== 'checked_in') {
                $msg = !$attendance ? 'No active check-in found for this user.' : 'Already checked out today.';
                return response()->json([
                    'message' => $msg,
                    'user_name' => trim($user->first_name . ' ' . $user->last_name),
                    'profile_picture_url' => $user->profile_picture_url,
                    'student_number' => $user->student_number,
                ], 400); 
            }

            $attendance->time_out = now();
            $attendance->status = 'checked_out';
            $attendance->save();

            return response()->json([
                'message' => 'Checked out successfully!',
                'user_name' => trim($user->first_name . ' ' . $user->last_name),
                'profile_picture_url' => $user->profile_picture_url,
                'student_number' => $user->student_number,
                'course' => $user->course,
                'year_level' => $user->year_level,
                'attendance' => $attendance->load('user', 'event'),
                'duration' => $attendance->formatted_duration,
            ], 200);

        }
        catch (\Exception $e) {
            Log::error('RFID check-out error: ' . $e->getMessage());
            return response()->json(['message' => 'Error during RFID check-out', 'error' => $e->getMessage()], 500);
        }
    }

    // ── RFID Smart Auto-Scan ───────────────────────────────────────────────

    public function rfidScan(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'rfid_uid' => 'required|string',
            ]);

            $user = User::where('rfid_uid', $data['rfid_uid'])->first();
            if (!$user) {
                return response()->json([
                    'message' => 'No user found with this RFID card.',
                    'action' => 'unknown',
                    'rfid_uid' => $data['rfid_uid'],
                ], 404);
            }

            $event = Event::findOrFail($data['event_id']);
            $authUser = auth()->user();
            if (!$authUser->isOfficerOf($event->organization_id)) {
                return response()->json(['message' => 'Unauthorized. You can only scan for your organization\'s events.'], 403);
            }

            $userPayload = [
                'user_name' => trim($user->first_name . ' ' . $user->last_name),
                'profile_picture_url' => $user->profile_picture_url,
                'student_number' => $user->student_number,
                'course' => $user->course,
                'year_level' => $user->year_level,
            ];

            $attendance = Attendance::where('event_id', $data['event_id'])
                ->where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->orderBy('created_at', 'desc')
                ->first();

            // CASE 1: Never checked in today → check IN
            if (!$attendance) {
                $attendance = Attendance::create([
                    'event_id' => $data['event_id'],
                    'user_id' => $user->id,
                    'attendance_type' => 'RFID',
                    'time_in' => now(),
                    'status' => 'checked_in',
                ]);
                return response()->json(array_merge($userPayload, [
                    'action' => 'checkin',
                    'message' => 'Checked in successfully!',
                ]), 201);
            }

            // CASE 2: Currently checked in → check OUT
            if ($attendance->status === 'checked_in' && is_null($attendance->time_out)) {
                $attendance->time_out = now();
                $attendance->status = 'checked_out';
                $attendance->save();
                return response()->json(array_merge($userPayload, [
                    'action' => 'checkout',
                    'message' => 'Checked out successfully!',
                    'duration' => $attendance->formatted_duration,
                ]), 200);
            }

            // CASE 3: Already checked out today → block
            if ($attendance->status === 'checked_out') {
                return response()->json(array_merge($userPayload, [
                    'action' => 'already_checkout',
                    'message' => 'Already checked out for this event today.',
                ]), 200);
            }

            // Fallback
            return response()->json(array_merge($userPayload, [
                'action' => 'already_checkin',
                'message' => 'Already checked in.',
            ]), 200);

        }
        catch (\Exception $e) {
            Log::error('RFID smart scan error: ' . $e->getMessage());
            return response()->json(['message' => 'Scan error: ' . $e->getMessage()], 500);
        }
    }
}
