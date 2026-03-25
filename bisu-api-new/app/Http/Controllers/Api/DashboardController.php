<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Organization;
use App\Models\Student;
use App\Models\SchoolYear;
use App\Models\Attendance;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function adminStats(Request $request)
    {
        $schoolYearId = $request->query('school_year_id');
        
        if (!$schoolYearId) {
            $active = SchoolYear::where('is_active', true)->first();
            $schoolYearId = $active ? $active->id : null;
        }

        $totalStudents = Student::count();
        $totalOrgs = Organization::count();
        
        $eventQuery = Event::where('school_year_id', $schoolYearId);
        $totalEvents = (clone $eventQuery)->count();
        $completedEvents = (clone $eventQuery)->where('status', 'completed')->count();

        // Attendance stats
        $totalAttendance = Attendance::whereHas('event', function($q) use ($schoolYearId) {
            $q->where('school_year_id', $schoolYearId);
        })->count();

        return response()->json([
            'total_students' => $totalStudents,
            'total_organizations' => $totalOrgs,
            'total_events' => $totalEvents,
            'completed_events' => $completedEvents,
            'total_attendance' => $totalAttendance,
            'school_year_id' => $schoolYearId
        ]);
    }

    public function officerStats(Request $request)
    {
        $user = auth()->user();
        $orgId = $user->getOfficerOrganizationId();
        
        if (!$orgId) {
            return response()->json(['message' => 'Not an officer'], 403);
        }

        $schoolYearId = $request->query('school_year_id');
        if (!$schoolYearId) {
            $active = SchoolYear::where('is_active', true)->first();
            $schoolYearId = $active ? $active->id : null;
        }

        $totalMembers = \App\Models\MemberOrganization::where('organization_id', $orgId)
            ->where('status', 'active')
            ->where('school_year_id', $schoolYearId)
            ->count();

        $eventQuery = Event::where('organization_id', $orgId)
            ->where('school_year_id', $schoolYearId);
            
        $totalEvents = (clone $eventQuery)->count();
        
        $totalAttendance = Attendance::whereHas('event', function($q) use ($orgId, $schoolYearId) {
            $q->where('organization_id', $orgId)->where('school_year_id', $schoolYearId);
        })->count();

        return response()->json([
            'total_members' => $totalMembers,
            'total_events' => $totalEvents,
            'total_attendance' => $totalAttendance,
            'school_year_id' => $schoolYearId
        ]);
    }
}
