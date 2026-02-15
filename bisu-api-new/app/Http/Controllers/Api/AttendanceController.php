<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    // ── Check In via QR Code ───────────────────────────────────────────────
    public function checkIn(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'qr_code'  => 'required|string',
            ]);

            $event = Event::where('id', $data['event_id'])
                         ->where('qr_code', $data['qr_code'])
                         ->first();

            if (!$event) {
                return response()->json(['message' => 'Invalid QR code for this event'], 400);
            }

            // Get the student_id (students.id) from the authenticated user
            $user = auth()->user();
            $studentId = $user->student_id; // This is students.id (bigint FK)

            if (!$studentId) {
                return response()->json(['message' => 'User is not linked to a student record'], 400);
            }

            $existing = Attendance::where('event_id', $data['event_id'])
                                  ->where('student_id', $studentId)
                                  ->whereDate('time_in', today())
                                  ->where('status', 'checked_in')
                                  ->whereNull('time_out')
                                  ->first();

            if ($existing) {
                return response()->json([
                    'message'    => 'Already checked in',
                    'attendance' => $existing->load('student', 'event'),
                ], 200);
            }

            $attendance = Attendance::create([
                'event_id'        => $data['event_id'],
                'student_id'      => $studentId,
                'attendance_type' => 'QR',
                'time_in'         => now(),
                'status'          => 'checked_in',
            ]);

            return response()->json([
                'message'    => 'Checked in successfully!',
                'attendance' => $attendance->load('student', 'event'),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Check-in error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking in', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Check Out via QR Code ──────────────────────────────────────────────
    public function checkOut(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'qr_code'  => 'required|string',
            ]);

            $event = Event::where('id', $data['event_id'])
                         ->where('qr_code', $data['qr_code'])
                         ->first();

            if (!$event) {
                return response()->json(['message' => 'Invalid QR code for this event'], 400);
            }

            $user = auth()->user();
            $studentId = $user->student_id;

            if (!$studentId) {
                return response()->json(['message' => 'User is not linked to a student record'], 400);
            }

            $attendance = Attendance::where('event_id', $data['event_id'])
                                    ->where('student_id', $studentId)
                                    ->where('status', 'checked_in')
                                    ->whereNull('time_out')
                                    ->orderBy('time_in', 'desc')
                                    ->first();

            if (!$attendance) {
                return response()->json(['message' => 'No active check-in found. Please check in first.'], 400);
            }

            $attendance->time_out = now();
            $attendance->status   = 'checked_out';
            $attendance->save();

            return response()->json([
                'message'    => 'Checked out successfully!',
                'attendance' => $attendance->load('student', 'event'),
                'duration'   => $attendance->formatted_duration,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Check-out error: ' . $e->getMessage());
            return response()->json(['message' => 'Error checking out', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Get Event Attendance (Admin) ───────────────────────────────────────
    public function getEventAttendance($eventId)
    {
        try {
            $attendance = Attendance::with(['student.department', 'student.program'])
                ->where('event_id', $eventId)
                ->orderBy('time_in', 'desc')
                ->get()
                ->map(function ($record) {
                    // Format the data for the frontend
                    $student = $record->student;
                    return [
                        'id'                => $record->id,
                        'event_id'          => $record->event_id,
                        'student_id'        => $record->student_id,
                        'attendance_type'   => $record->attendance_type,
                        'time_in'           => $record->time_in,
                        'time_out'          => $record->time_out,
                        'status'            => $record->status,
                        'remarks'           => $record->remarks,
                        'is_active'         => $record->is_active,
                        'formatted_duration'=> $record->formatted_duration,
                        'created_at'        => $record->created_at,
                        'updated_at'        => $record->updated_at,
                        'student'           => $student ? [
                            'id'          => $student->id,
                            'name'        => $student->name,
                            'student_id'  => $student->student_id, // varchar like "2024-00001"
                            'year_level'  => $student->year_level,
                            'department'  => $student->department,
                            'program'     => $student->program,
                        ] : null,
                        'event' => $record->event,
                    ];
                });

            $stats = [
                'total'       => $attendance->count(),
                'checked_in'  => $attendance->where('status', 'checked_in')->count(),
                'checked_out' => $attendance->where('status', 'checked_out')->count(),
            ];

            return response()->json(['attendance' => $attendance, 'stats' => $stats]);

        } catch (\Exception $e) {
            Log::error('Get attendance error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching attendance', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Get My Attendance History ──────────────────────────────────────────
    public function getMyAttendance()
    {
        try {
            $user = auth()->user();
            $studentId = $user->student_id;

            if (!$studentId) {
                return response()->json(['message' => 'User is not linked to a student record'], 400);
            }

            $attendance = Attendance::with(['event.organization', 'student'])
                ->where('student_id', $studentId)
                ->orderBy('time_in', 'desc')
                ->get();

            return response()->json($attendance);

        } catch (\Exception $e) {
            Log::error('Get my attendance error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching attendance', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Get Current Status for Event ───────────────────────────────────────
    public function getCurrentStatus($eventId)
    {
        try {
            $user = auth()->user();
            $studentId = $user->student_id;

            if (!$studentId) {
                return response()->json(['status' => 'not_checked_in', 'message' => 'Not linked to student record']);
            }

            $attendance = Attendance::where('event_id', $eventId)
                                    ->where('student_id', $studentId)
                                    ->orderBy('time_in', 'desc')
                                    ->first();

            if (!$attendance) {
                return response()->json(['status' => 'not_checked_in', 'message' => 'Not checked in']);
            }

            return response()->json([
                'status'     => $attendance->status,
                'attendance' => $attendance,
                'is_active'  => $attendance->is_active,
                'duration'   => $attendance->formatted_duration,
            ]);

        } catch (\Exception $e) {
            Log::error('Get status error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching status', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Manual Check In (Admin) ────────────────────────────────────────────
    public function manualCheckIn(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id'   => 'required|exists:events,id',
                'student_id' => 'required|exists:students,id', // ✅ Now validates against students.id
                'time_in'    => 'nullable|date',
                'remarks'    => 'nullable|string',
            ]);

            // Check if already checked in
            $existing = Attendance::where('event_id', $data['event_id'])
                                  ->where('student_id', $data['student_id'])
                                  ->whereDate('time_in', today())
                                  ->where('status', 'checked_in')
                                  ->whereNull('time_out')
                                  ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'student_id' => ['This student is already checked in for this event today.'],
                ]);
            }

            $attendance = Attendance::create([
                'event_id'        => $data['event_id'],
                'student_id'      => $data['student_id'], // students.id
                'attendance_type' => 'manual',
                'time_in'         => $data['time_in'] ?? now(),
                'status'          => 'checked_in',
                'remarks'         => $data['remarks'] ?? null,
            ]);

            return response()->json([
                'message'    => 'Manual check-in recorded',
                'attendance' => $attendance->load('student', 'event'),
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Manual check-in error: ' . $e->getMessage());
            return response()->json(['message' => 'Error recording check-in', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Manual Check Out (Admin) ───────────────────────────────────────────
    public function manualCheckOut(Request $request)
    {
        try {
            $data = $request->validate([
                'attendance_id' => 'required|exists:attendances,id',
                'time_out'      => 'nullable|date',
                'remarks'       => 'nullable|string',
            ]);

            $attendance = Attendance::findOrFail($data['attendance_id']);

            if ($attendance->status === 'checked_out') {
                return response()->json(['message' => 'Already checked out'], 400);
            }

            $attendance->time_out = $data['time_out'] ?? now();
            $attendance->status   = 'checked_out';
            if (isset($data['remarks'])) {
                $attendance->remarks = $data['remarks'];
            }
            $attendance->save();

            return response()->json([
                'message'    => 'Manual check-out recorded',
                'attendance' => $attendance->load('student', 'event'),
                'duration'   => $attendance->formatted_duration,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Manual check-out error: ' . $e->getMessage());
            return response()->json(['message' => 'Error recording check-out', 'error' => $e->getMessage()], 500);
        }
    }
}