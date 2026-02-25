<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberOrganization;
use App\Models\Organization;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MemberOrganizationController extends Controller
{
    // ── GET /api/organizations/{org_id}/members ───────────────────────────
    public function index(Request $request, $orgId)
    {
        try {
            Organization::findOrFail($orgId);

            // Join students table so we can sort by name safely
            $query = MemberOrganization::with(['student.department', 'student.user'])
                ->join('students', 'students.id', '=', 'member_organizations.student_id')
                ->where('member_organizations.organization_id', $orgId)
                ->select('member_organizations.*');

            // ?status=active|inactive|all  (default: active)
            $status = $request->query('status', 'active');
            if ($status !== 'all') {
                $query->where('member_organizations.status', $status);
            }

            // ?role=member|officer|adviser
            if ($request->filled('role')) {
                $query->where('member_organizations.role', $request->query('role'));
            }

            // ?search=<name or student number>
            if ($request->filled('search')) {
                $s = $request->search;
                $query->where(function ($q) use ($s) {
                    $q->where('students.first_name',       'like', "%{$s}%")
                      ->orWhere('students.last_name',      'like', "%{$s}%")
                      ->orWhere('students.student_number', 'like', "%{$s}%");
                });
            }

            $members = $query
                ->orderByRaw("FIELD(member_organizations.role, 'adviser', 'officer', 'member')")
                ->orderBy('students.last_name')
                ->orderBy('students.first_name')
                ->get();

            // ── Real attendance rate ──────────────────────────────────────
            $eventIds    = Event::where('organization_id', $orgId)
                ->whereIn('status', ['completed', 'ongoing'])
                ->pluck('id');
            $totalEvents = $eventIds->count();

            if ($totalEvents > 0) {
                $counts = Attendance::whereIn('event_id', $eventIds)
                    ->whereIn('student_id', $members->pluck('student_id'))
                    ->select('student_id', DB::raw('COUNT(*) as attended'))
                    ->groupBy('student_id')
                    ->pluck('attended', 'student_id');

                $members->each(function ($m) use ($totalEvents, $counts) {
                    $attended = $counts[$m->student_id] ?? 0;
                    $m->setAttribute('attendance_rate', round(($attended / $totalEvents) * 100));
                });
            } else {
                $members->each(fn($m) => $m->setAttribute('attendance_rate', null));
            }

            return response()->json($members);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Organization not found'], 404);
        } catch (\Exception $e) {
            Log::error('MemberOrg index error: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['message' => 'Error fetching members', 'error' => $e->getMessage()], 500);
        }
    }

    // ── POST /api/organizations/{org_id}/members ──────────────────────────
    public function store(Request $request, $orgId)
    {
        try {
            Organization::findOrFail($orgId);

            $data = $request->validate([
                'student_id'  => 'required|exists:students,id',
                'role'        => 'required|in:member,officer,adviser',
                'position'    => 'nullable|string|max:100',
                'joined_date' => 'nullable|date',
            ]);

            $existing = MemberOrganization::where('organization_id', $orgId)
                ->where('student_id', $data['student_id'])
                ->where('status', 'active')
                ->first();

            if ($existing) {
                return response()->json(['message' => 'Student is already an active member of this organization.'], 422);
            }

            $membership = MemberOrganization::updateOrCreate(
                ['organization_id' => $orgId, 'student_id' => $data['student_id']],
                [
                    'role'        => $data['role'],
                    'position'    => $data['position'] ?? null,
                    'status'      => 'active',
                    'joined_date' => $data['joined_date'] ?? now()->toDateString(),
                ]
            );

            $membership->load(['student.department', 'student.user']);

            return response()->json([
                'message'    => 'Member added successfully.',
                'membership' => $membership,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('MemberOrg store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error adding member', 'error' => $e->getMessage()], 500);
        }
    }

    // ── PATCH /api/organizations/{org_id}/members/{membershipId}/role ─────
    public function updateRole(Request $request, $orgId, $membershipId)
    {
        try {
            $membership = MemberOrganization::where('organization_id', $orgId)
                ->findOrFail($membershipId);

            $data = $request->validate([
                'role'     => 'required|in:member,officer,adviser',
                'position' => 'nullable|string|max:100',
            ]);

            $membership->update([
                'role'     => $data['role'],
                'position' => $data['position'] ?? $membership->position,
            ]);

            $membership->load(['student.department', 'student.user']);

            return response()->json([
                'message'    => 'Member role updated successfully.',
                'membership' => $membership,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('MemberOrg updateRole error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating role', 'error' => $e->getMessage()], 500);
        }
    }

    // ── DELETE /api/organizations/{org_id}/members/{membershipId} ─────────
    public function destroy($orgId, $membershipId)
    {
        try {
            $membership = MemberOrganization::where('organization_id', $orgId)
                ->findOrFail($membershipId);

            $membership->update(['status' => 'inactive']);

            return response()->json(['message' => 'Member removed successfully.']);

        } catch (\Exception $e) {
            Log::error('MemberOrg destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Error removing member', 'error' => $e->getMessage()], 500);
        }
    }

    // ── GET /api/organizations/{org_id}/students/search ───────────────────
    public function searchStudents(Request $request, $orgId)
    {
        try {
            $search = $request->query('q', '');

            $existingIds = MemberOrganization::where('organization_id', $orgId)
                ->where('status', 'active')
                ->pluck('student_id');

            $students = Student::with('department')
                ->whereNotIn('id', $existingIds)
                ->where(function ($q) use ($search) {
                    $q->where('first_name',       'like', "%{$search}%")
                      ->orWhere('last_name',       'like', "%{$search}%")
                      ->orWhere('student_number',  'like', "%{$search}%");
                })
                ->orderBy('last_name')
                ->limit(20)
                ->get()
                ->map(fn($s) => [
                    'id'             => $s->id,
                    'student_number' => $s->student_number,
                    'full_name'      => trim("{$s->first_name} " . ($s->middle_name ? "{$s->middle_name} " : '') . $s->last_name),
                    'course'         => $s->course,
                    'year_level'     => $s->year_level,
                    'department'     => $s->department?->name,
                ]);

            return response()->json($students);

        } catch (\Exception $e) {
            Log::error('MemberOrg searchStudents error: ' . $e->getMessage());
            return response()->json(['message' => 'Error searching students', 'error' => $e->getMessage()], 500);
        }
    }
}