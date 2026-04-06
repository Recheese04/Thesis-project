<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use App\Models\Organization;
use App\Models\User;
use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DesignationController extends Controller
{
    // ── GET /api/organizations/{org_id}/members ───────────────────────────
    public function index(Request $request, $orgId)
    {
        try {
            Organization::findOrFail($orgId);

            $query = Designation::with(['user.college', 'user.course'])
                ->join('users', 'users.id', '=', 'designations.user_id')
                ->where('designations.organization_id', $orgId)
                ->select('designations.*');

            $status = $request->query('status', 'active');
            if ($status !== 'all') {
                $query->where('designations.status', $status);
            }

            if ($request->filled('designation')) {
                $query->where('designations.designation', $request->query('designation'));
            }

            if ($request->filled('search')) {
                $s = $request->search;
                $query->whereRaw('(users.first_name LIKE ? OR users.last_name LIKE ? OR users.student_number LIKE ?)', ["%{$s}%", "%{$s}%", "%{$s}%"]);
            }

            $members = $query
                ->orderBy('users.last_name')
                ->orderBy('users.first_name')
                ->get();

            // ── Attendance rate ──────────────────────────────────────────────────
            $eventIds    = Event::where('organization_id', $orgId)
                ->whereIn('status', ['completed', 'ongoing'])
                ->pluck('id');
            $totalEvents = $eventIds->count();

            if ($totalEvents > 0) {
                $counts = Attendance::whereIn('event_id', $eventIds)
                    ->whereIn('user_id', $members->pluck('user_id'))
                    ->select('user_id', DB::raw('COUNT(*) as attended'))
                    ->groupBy('user_id')
                    ->pluck('attended', 'user_id');

                $members->each(function ($m) use ($totalEvents, $counts) {
                    $attended = $counts[$m->user_id] ?? 0;
                    $m->setAttribute('attendance_rate', round(($attended / $totalEvents) * 100));
                });
            } else {
                $members->each(fn($m) => $m->setAttribute('attendance_rate', null));
            }

            // ── Map response ─────────────────────────────────────────────
            $mapped = $members->map(fn($m) => [
                'id'              => $m->id,
                'user_id'         => $m->user_id,
                'designation'     => $m->designation,
                'status'          => $m->status,
                'joined_date'     => $m->joined_date,
                'attendance_rate' => $m->attendance_rate,
                'user'            => [
                    'id'                  => $m->user->id ?? null,
                    'first_name'          => $m->user->first_name ?? '',
                    'last_name'           => $m->user->last_name ?? '',
                    'middle_name'         => $m->user->middle_name ?? '',
                    'student_number'      => $m->user->student_number ?? '',
                    'email'               => $m->user->email ?? null,
                    'contact_number'      => $m->user->contact_number ?? null,
                    'course'              => $m->user->course?->name ?? null,
                    'year_level'          => $m->user->year_level ?? null,
                    'college'             => $m->user->college?->name ?? null,
                    'rfid_uid'            => $m->user->rfid_uid ?? null,
                    'profile_picture_url' => $m->user->profile_picture_url ?? null,
                ],
            ]);

            return response()->json($mapped);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Organization not found'], 404);
        } catch (\Exception $e) {
            Log::error('Designation index error: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['message' => 'Error fetching members', 'error' => $e->getMessage()], 500);
        }
    }

    // ── POST /api/organizations/{org_id}/members ─────────────────────────
    public function store(Request $request, $orgId)
    {
        try {
            Organization::findOrFail($orgId);

            $data = $request->validate([
                'user_id'     => 'required|exists:users,id',
                'designation' => 'required|string|max:100',
                'joined_date' => 'nullable|date',
            ]);

            $existing = Designation::where('organization_id', $orgId)
                ->where('user_id', $data['user_id'])
                ->where('status', 'active')
                ->first();

            if ($existing) {
                return response()->json(['message' => 'User is already an active member of this organization.'], 422);
            }

            $designation = Designation::updateOrCreate(
                ['organization_id' => $orgId, 'user_id' => $data['user_id']],
                [
                    'designation'  => $data['designation'],
                    'status'       => 'active',
                    'joined_date'  => $data['joined_date'] ?? now()->toDateString(),
                ]
            );

            $designation->load(['user.college', 'user.course']);

            return response()->json([
                'message'     => 'Member added successfully.',
                'designation' => [
                    'id'          => $designation->id,
                    'user_id'     => $designation->user_id,
                    'designation' => $designation->designation,
                    'status'      => $designation->status,
                    'joined_date' => $designation->joined_date,
                    'user'        => [
                        'id'                  => $designation->user->id ?? null,
                        'first_name'          => $designation->user->first_name ?? '',
                        'last_name'           => $designation->user->last_name ?? '',
                        'middle_name'         => $designation->user->middle_name ?? '',
                        'student_number'      => $designation->user->student_number ?? '',
                        'email'               => $designation->user->email ?? null,
                        'contact_number'      => $designation->user->contact_number ?? null,
                        'course'              => $designation->user->course?->name ?? null,
                        'year_level'          => $designation->user->year_level ?? null,
                        'college'             => $designation->user->college?->name ?? null,
                        'rfid_uid'            => $designation->user->rfid_uid ?? null,
                        'profile_picture_url' => $designation->user->profile_picture_url ?? null,
                    ],
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Designation store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error adding member', 'error' => $e->getMessage()], 500);
        }
    }

    // ── PATCH /api/organizations/{org_id}/members/{designationId}/designation ─
    public function updateDesignation(Request $request, $orgId, $designationId)
    {
        try {
            $record = Designation::where('organization_id', $orgId)
                ->findOrFail($designationId);

            $data = $request->validate([
                'designation' => 'required|string|max:100',
            ]);

            $record->update([
                'designation' => $data['designation'],
            ]);

            $record->load(['user.college', 'user.course']);

            return response()->json([
                'message'     => 'Designation updated successfully.',
                'designation' => $record,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Designation update error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating designation', 'error' => $e->getMessage()], 500);
        }
    }

    // ── DELETE /api/organizations/{org_id}/members/{designationId} ─────────
    public function destroy($orgId, $designationId)
    {
        try {
            $record = Designation::where('organization_id', $orgId)
                ->findOrFail($designationId);

            $record->update(['status' => 'inactive']);

            return response()->json(['message' => 'Member removed successfully.']);

        } catch (\Exception $e) {
            Log::error('Designation destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Error removing member', 'error' => $e->getMessage()], 500);
        }
    }

    // ── GET /api/organizations/{org_id}/students/search ───────────────────
    public function searchStudents(Request $request, $orgId)
    {
        try {
            $search = $request->query('q', '');

            $existingIds = Designation::where('organization_id', $orgId)
                ->where('status', 'active')
                ->pluck('user_id');

            $users = User::with(['college', 'course'])
                ->whereNotNull('student_number')
                ->whereNotIn('id', $existingIds)
                ->whereRaw('(first_name LIKE ? OR last_name LIKE ? OR student_number LIKE ?)', ["%{$search}%", "%{$search}%", "%{$search}%"])
                ->orderBy('last_name')
                ->limit(20)
                ->get()
                ->map(fn($s) => [
                    'id'             => $s->id,
                    'student_number' => $s->student_number,
                    'full_name'      => trim("{$s->first_name} " . ($s->middle_name ? "{$s->middle_name} " : '') . $s->last_name),
                    'course'         => $s->course?->name,
                    'year_level'     => $s->year_level,
                    'college'        => $s->college?->name,
                ]);

            return response()->json($users);

        } catch (\Exception $e) {
            Log::error('Designation searchStudents error: ' . $e->getMessage());
            return response()->json(['message' => 'Error searching students', 'error' => $e->getMessage()], 500);
        }
    }

    public function memberAttendance($orgId, $userId)
    {
        try {
            $events = Event::where('organization_id', $orgId)
                ->whereIn('status', ['completed', 'ongoing', 'upcoming'])
                ->orderBy('event_date', 'desc')
                ->get();

            $attendances = Attendance::where('user_id', $userId)
                ->whereIn('event_id', $events->pluck('id'))
                ->get()
                ->keyBy('event_id');

            $history = $events->map(function ($event) use ($attendances) {
                $att = $attendances->get($event->id);
                return [
                    'event_title'  => $event->title,
                    'event_date'   => $event->event_date ? \Carbon\Carbon::parse($event->event_date)->format('M d, Y') : null,
                    'event_status' => $event->status,
                    'attended'     => $att !== null,
                    'time_in'      => $att && $att->time_in ? $att->time_in->format('h:i A') : null,
                    'time_out'     => $att && $att->time_out ? $att->time_out->format('h:i A') : null,
                ];
            });

            return response()->json($history);
        } catch (\Exception $e) {
            Log::error('Designation attendance history error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching attendance history', 'error' => $e->getMessage()], 500);
        }
    }
}
