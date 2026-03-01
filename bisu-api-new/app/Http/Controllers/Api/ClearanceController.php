<?php

namespace App\Http\Controllers\Api; // ← FIXED (was App\Http\Controllers)

use App\Http\Controllers\Controller;
use App\Models\ClearanceRequirement;
use App\Models\StudentClearance;
use App\Models\MemberOrganization;
use App\Models\Attendance;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ClearanceController extends Controller
{
    // GET /api/organizations/{orgId}/clearance-requirements
    public function getRequirements($orgId)
    {
        $requirements = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1)
            ->get();

        return response()->json($requirements);
    }

    // POST /api/organizations/{orgId}/clearance-requirements
    public function storeRequirement(Request $request, $orgId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:auto,manual',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'school_year' => 'nullable|string',
            'semester' => 'nullable|in:1st,2nd,summer',
        ]);

        $req = ClearanceRequirement::create([
            ...$validated,
            'organization_id' => $orgId,
        ]);

        return response()->json($req, 201);
    }

    // GET /api/students/{studentId}/clearance?org_id=X&school_year=2025-2026&semester=2nd
    public function getStudentClearance(Request $request, $studentId)
    {
        $orgId = $request->query('org_id');
        $schoolYear = $request->query('school_year', '2025-2026');
        $semester = $request->query('semester', '2nd');

        $requirements = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1)
            ->get();

        $clearances = StudentClearance::where('student_id', $studentId)
            ->where('organization_id', $orgId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->get()
            ->keyBy('requirement_id');

        $result = $requirements->map(function ($req) use ($studentId, $orgId, $clearances) {
            if ($req->type === 'auto') {
                $data = $this->computeAttendanceClearance($studentId, $orgId);
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
        $schoolYear = $request->query('school_year', '2025-2026');
        $semester = $request->query('semester', '2nd');

        $members = MemberOrganization::with('student')
            ->where('organization_id', $orgId)
            ->where('status', 'active')
            ->get();

        $requirements = ClearanceRequirement::where('organization_id', $orgId)
            ->where('is_active', 1)
            ->get();

        $allClearances = StudentClearance::where('organization_id', $orgId)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->get()
            ->groupBy('student_id');

        $result = $members->map(function ($member) use ($requirements, $allClearances, $orgId) {
            $studentId = $member->student_id;
            $clearances = $allClearances->get($studentId, collect())->keyBy('requirement_id');

            $reqStatuses = $requirements->map(function ($req) use ($studentId, $orgId, $clearances) {
                    if ($req->type === 'auto') {
                        $data = $this->computeAttendanceClearance($studentId, $orgId);
                        return [
                        'requirement_id' => $req->id,
                        'name' => $req->name,
                        'status' => $data['status'],
                        'notes' => $data['notes'],
                        ];
                    }
                    $clearance = $clearances->get($req->id);
                    return [
                    'requirement_id' => $req->id,
                    'name' => $req->name,
                    'status' => $clearance ? $clearance->status : 'pending',
                    'notes' => $clearance ? $clearance->notes : null,
                    ];
                }
                );

                $cleared = $reqStatuses->where('status', 'cleared')->count();

                return [
                'student_id' => $studentId,
                'student_name' => $member->student->first_name . ' ' . $member->student->last_name,
                'position' => $member->position,
                'requirements' => $reqStatuses->values(),
                'cleared' => $cleared,
                'total' => $requirements->count(),
                'overall' => $cleared === $requirements->count() ? 'cleared' : 'pending',
                ];
            });

        return response()->json($result);
    }

    // POST /api/clearance/{requirementId}/students/{studentId}/clear
    public function clearRequirement(Request $request, $requirementId, $studentId)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'school_year' => 'required|string',
            'semester' => 'required|in:1st,2nd,summer',
        ]);

        $req = ClearanceRequirement::findOrFail($requirementId);

        $clearance = StudentClearance::updateOrCreate(
        [
            'student_id' => $studentId,
            'organization_id' => $req->organization_id,
            'requirement_id' => $requirementId,
            'school_year' => $validated['school_year'],
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

    // POST /api/clearance/{requirementId}/students/{studentId}/reject
    public function rejectRequirement(Request $request, $requirementId, $studentId)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'school_year' => 'required|string',
            'semester' => 'required|in:1st,2nd,summer',
        ]);

        $req = ClearanceRequirement::findOrFail($requirementId);

        $clearance = StudentClearance::updateOrCreate(
        [
            'student_id' => $studentId,
            'organization_id' => $req->organization_id,
            'requirement_id' => $requirementId,
            'school_year' => $validated['school_year'],
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
    private function computeAttendanceClearance($studentId, $orgId)
    {
        $totalEvents = Event::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->count();

        $attended = Attendance::whereHas('event', function ($q) use ($orgId) {
            $q->where('organization_id', $orgId)->where('status', 'completed');
        })
            ->where('student_id', $studentId)
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