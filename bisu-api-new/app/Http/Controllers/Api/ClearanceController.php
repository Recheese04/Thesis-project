<?php

namespace App\Http\Controllers\Api; 

use App\Http\Controllers\Controller;
use App\Models\ClearanceRequirement;
use App\Models\StudentClearance;
use App\Models\Designation;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ClearanceController extends Controller
{
    /**
     * Only officers / advisers / admins of the given org may manage clearance.
     */
    private function authorizeOfficer($orgId)
    {
        $user = Auth::user();
        if (!$user)
            return false;
        if ($user->user_type_id === 1)
            return true; // admin

        $m = Designation::where('organization_id', $orgId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        return $m && !in_array($m->designation, ['Member']);
    }

    // GET /api/organizations/{orgId}/clearance-requirements
    public function getRequirements(Request $request, $orgId)
    {
        $schoolYearId = $request->query('school_year_id');
        $semester = $request->query('semester', '1st');

        if (!$schoolYearId) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            $schoolYearId = $activeYear ? $activeYear->id : null;
        }

        $query = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1);

        if ($schoolYearId) {
            $query->where('school_year_id', $schoolYearId);
        }
        if ($semester) {
            $query->where('semester', $semester);
        }

        return response()->json($query->get());
    }

    // POST /api/organizations/{orgId}/clearance-requirements
    public function storeRequirement(Request $request, $orgId)
    {
        if (!$this->authorizeOfficer($orgId)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:auto,manual',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'school_year_id' => 'nullable|exists:school_years,id',
            'semester' => 'nullable|in:1st,2nd,summer',
        ]);

        if (empty($validated['school_year_id'])) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            if ($activeYear) {
                $validated['school_year_id'] = $activeYear->id;
            }
        }

        $req = ClearanceRequirement::create([
            ...$validated,
            'organization_id' => $orgId,
        ]);

        return response()->json($req, 201);
    }

    // GET /api/users/{userId}/clearance?org_id=X&school_year=2025-2026&semester=2nd
    public function getStudentClearance(Request $request, $userId)
    {
        $orgId = $request->query('org_id');
        $schoolYearId = $request->query('school_year_id');
        $semester = $request->query('semester', '2nd');

        if (!$schoolYearId) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            $schoolYearId = $activeYear ? $activeYear->id : null;
        }

        $requirements = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1)
            ->where('school_year_id', $schoolYearId)
            ->get();

        $clearances = StudentClearance::where('user_id', $userId)
            ->where('organization_id', $orgId)
            ->where('school_year_id', $schoolYearId)
            ->where('semester', $semester)
            ->get()
            ->keyBy('requirement_id');

        $result = $requirements->map(function ($req) use ($userId, $orgId, $clearances) {
            if ($req->type === 'auto') {
                $data = $this->computeAttendanceClearance($userId, $orgId);
                return [
                'requirement' => $req,
                'status' => $data['status'],
                'notes' => $data['notes'],
                'cleared_at' => null,
                'cleared_by' => null,
                ];
            }

            $clearance = $clearances->get($req->id);

            return [
            'requirement' => $req,
            'status' => $clearance ? $clearance->status : 'pending',
            'notes' => $clearance ? $clearance->notes : null,
            'cleared_at' => $clearance ? $clearance->cleared_at : null,
            'cleared_by' => $clearance && $clearance->clearedBy ? $clearance->clearedBy->email : null,
            ];
        });

        $cleared = $result->where('status', 'cleared')->count();
        $total = $result->count();

        return response()->json([
            'overall_status' => $cleared === $total ? 'cleared' : 'pending',
            'completion_rate' => $total > 0 ? round(($cleared / $total) * 100) : 0,
            'completed' => $cleared,
            'pending' => $total - $cleared,
            'requirements' => $result->values(),
        ]);
    }

    // GET /api/organizations/{orgId}/clearance?school_year=X&semester=X
    public function getOrgClearance(Request $request, $orgId)
    {
        $schoolYearId = $request->query('school_year_id');
        $semester = $request->query('semester', '2nd');

        if (!$schoolYearId) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            $schoolYearId = $activeYear ? $activeYear->id : null;
        }

        $members = Designation::with('user')
            ->where('organization_id', $orgId)
            ->where('status', 'active')
            ->get();

        $requirements = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1)
            ->where('school_year_id', $schoolYearId)
            ->get();

        $allClearances = StudentClearance::where('organization_id', $orgId)
            ->where('school_year_id', $schoolYearId)
            ->where('semester', $semester)
            ->get()
            ->groupBy('user_id');

        $result = $members->map(function ($member) use ($requirements, $allClearances, $orgId) {
            $userId = $member->user_id;
            $clearances = $allClearances->get($userId, collect())->keyBy('requirement_id');

            $reqStatuses = $requirements->map(function ($req) use ($userId, $orgId, $clearances) {
                    if ($req->type === 'auto') {
                        $data = $this->computeAttendanceClearance($userId, $orgId);
                        return [
                        'requirement_id' => $req->id,
                        'name' => $req->name,
                        'type' => $req->type,
                        'amount' => $req->amount,
                        'status' => $data['status'],
                        'notes' => $data['notes'],
                        ];
                    }
                    $clearance = $clearances->get($req->id);
                    return [
                    'requirement_id' => $req->id,
                    'name' => $req->name,
                    'type' => $req->type,
                    'amount' => $req->amount,
                    'status' => $clearance ? $clearance->status : 'pending',
                    'notes' => $clearance ? $clearance->notes : null,
                    ];
                }
                );

                $cleared = $reqStatuses->where('status', 'cleared')->count();

                return [
                'user_id' => $userId,
                'student_name' => $member->user->first_name . ' ' . $member->user->last_name,
                'position' => $member->position,
                'requirements' => $reqStatuses->values(),
                'cleared' => $cleared,
                'total' => $requirements->count(),
                'overall' => $cleared === $requirements->count() ? 'cleared' : 'pending',
                ];
            });

        return response()->json($result);
    }

    // POST /api/clearance/{requirementId}/users/{userId}/clear
    public function clearRequirement(Request $request, $requirementId, $userId)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'school_year_id' => 'nullable|exists:school_years,id',
            'semester' => 'required|in:1st,2nd,summer',
        ]);

        if (empty($validated['school_year_id'])) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            if ($activeYear) {
                $validated['school_year_id'] = $activeYear->id;
            }
        }

        $req = ClearanceRequirement::findOrFail($requirementId);

        // Authorization: must be officer/adviser/admin of this org
        if (!$this->authorizeOfficer($req->organization_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $clearance = StudentClearance::updateOrCreate(
        [
            'user_id' => $userId,
            'organization_id' => $req->organization_id,
            'requirement_id' => $requirementId,
            'school_year_id' => $validated['school_year_id'],
            'semester' => $validated['semester'],
        ],
        [
            'status' => 'cleared',
            'notes' => $validated['notes'] ?? null,
            'cleared_by' => Auth::id(),
            'cleared_at' => Carbon::now(),
        ]
        );

        return response()->json($clearance);
    }

    // POST /api/clearance/{requirementId}/users/{userId}/reject
    public function rejectRequirement(Request $request, $requirementId, $userId)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'school_year_id' => 'nullable|exists:school_years,id',
            'semester' => 'required|in:1st,2nd,summer',
        ]);

        if (empty($validated['school_year_id'])) {
            $activeYear = SchoolYear::where('is_active', true)->first();
            if ($activeYear) {
                $validated['school_year_id'] = $activeYear->id;
            }
        }

        $req = ClearanceRequirement::findOrFail($requirementId);

        // Authorization: must be officer/adviser/admin of this org
        if (!$this->authorizeOfficer($req->organization_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $clearance = StudentClearance::updateOrCreate(
        [
            'user_id' => $userId,
            'organization_id' => $req->organization_id,
            'requirement_id' => $requirementId,
            'school_year_id' => $validated['school_year_id'],
            'semester' => $validated['semester'],
        ],
        [
            'status' => 'rejected',
            'notes' => $validated['notes'] ?? null,
            'cleared_by' => Auth::id(),
            'cleared_at' => null,
        ]
        );

        return response()->json($clearance);
    }

    // ── Private: auto-compute attendance clearance ───────────────────────────
    private function computeAttendanceClearance($userId, $orgId)
    {
        $totalEvents = Event::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->count();

        $attended = Attendance::whereHas('event', function ($q) use ($orgId) {
            $q->where('organization_id', $orgId)->where('status', 'completed');
        })
            ->where('user_id', $userId)
            ->count();

        if ($totalEvents === 0) {
            return ['status' => 'pending', 'notes' => 'No completed events yet'];
        }

        $rate = ($attended / $totalEvents) * 100;
        $status = $rate >= 80 ? 'cleared' : 'pending';
        $notes = "{$attended}/{$totalEvents} events attended (" . round($rate) . "%)";

        return ['status' => $status, 'notes' => $notes];
    }
}