<?php

namespace App\Http\Controllers\Api;  // ← FIXED (was App\Http\Controllers)

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\ConsequenceRule;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\MemberOrganization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TaskController extends Controller
{
    // POST /api/events/{eventId}/close
    // Officer closes an event → triggers auto-consequence assignment
    public function closeEvent($eventId)
    {
        $event = Event::findOrFail($eventId);
        $event->update(['status' => 'completed']);

        $this->autoAssignConsequences($eventId);

        return response()->json(['message' => 'Event closed and consequences assigned.']);
    }

    // Called internally after event is closed
    private function autoAssignConsequences($eventId)
    {
        $event = Event::findOrFail($eventId);
        $orgId = $event->organization_id;

        // All active members of the org
        $memberStudentIds = MemberOrganization::where('organization_id', $orgId)
            ->where('status', 'active')
            ->pluck('student_id');

        // Who actually attended
        $attendedStudentIds = Attendance::where('event_id', $eventId)
            ->pluck('student_id');

        // Absent = members who did not attend
        $absentStudentIds = $memberStudentIds->diff($attendedStudentIds);

        if ($absentStudentIds->isEmpty()) return;

        // Match rules by event_category (your rules are set by category, not specific event_id)
        $rules = ConsequenceRule::where('organization_id', $orgId)
            ->where(function ($q) use ($eventId, $event) {
                $q->where('event_id', $eventId)
                  ->orWhere('event_category', $event->category); // ← use event->category column
            })
            ->get();

        if ($rules->isEmpty()) return;

        foreach ($absentStudentIds as $studentId) {
            $user = User::where('student_id', $studentId)->first();
            if (!$user) continue;

            foreach ($rules as $rule) {
                // Prevent duplicates: check by assigned_to + event_id + type
                // FIXED: was incorrectly using student_id_ref (column doesn't exist)
                $exists = Task::where('assigned_to', $user->id)
                    ->where('event_id', $eventId)
                    ->where('type', 'consequence')
                    ->exists();

                if ($exists) continue;

                Task::create([
                    'organization_id' => $orgId,
                    'assigned_to'     => $user->id,
                    'assigned_by'     => $event->created_by,
                    'title'           => $rule->consequence_title . ' (Missed: ' . $event->title . ')',
                    'description'     => $rule->consequence_description,
                    'due_date'        => Carbon::parse($event->event_date)->addDays($rule->due_days)->toDateString(),
                    'status'          => 'pending',
                    'type'            => 'consequence',
                    'event_id'        => $eventId,
                ]);
            }
        }
    }

    // GET /api/organizations/{orgId}/tasks
    public function index(Request $request, $orgId)
    {
        $type = $request->query('type'); // general | consequence | null = all

        $tasks = Task::with([
                'assignedTo.student', // FIXED: requires Task->assignedTo() relationship defined in Task model
                'event:id,title',
            ])
            ->where('organization_id', $orgId)
            ->when($type, fn($q) => $q->where('type', $type))
            ->latest()
            ->get()
            ->map(function ($task) {
                return [
                    'id'               => $task->id,
                    'title'            => $task->title,
                    'description'      => $task->description,
                    'status'           => $task->status,
                    'type'             => $task->type,
                    'priority'         => $task->priority ?? 'medium',
                    'due_date'         => $task->due_date,
                    'assigned_to'      => $task->assigned_to,
                    // Flattened for frontend convenience
                    'assigned_to_name' => $task->assignedTo
                        ? trim(($task->assignedTo->student->first_name ?? '') . ' ' . ($task->assignedTo->student->last_name ?? ''))
                        : null,
                    'event'            => $task->event ? ['id' => $task->event->id, 'title' => $task->event->title] : null,
                    'created_at'       => $task->created_at,
                ];
            });

        return response()->json($tasks);
    }

    // POST /api/organizations/{orgId}/tasks
    public function store(Request $request, $orgId)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
            'priority'    => 'nullable|in:low,medium,high',
        ]);

        $task = Task::create([
            ...$validated,
            'organization_id' => $orgId,
            'assigned_by'     => Auth::id(),
            'status'          => 'pending',
            'type'            => 'general',
        ]);

        // Return with name for immediate display
        $task->load('assignedTo.student');

        return response()->json([
            'id'               => $task->id,
            'title'            => $task->title,
            'description'      => $task->description,
            'status'           => $task->status,
            'type'             => $task->type,
            'priority'         => $task->priority ?? 'medium',
            'due_date'         => $task->due_date,
            'assigned_to'      => $task->assigned_to,
            'assigned_to_name' => $task->assignedTo
                ? trim(($task->assignedTo->student->first_name ?? '') . ' ' . ($task->assignedTo->student->last_name ?? ''))
                : null,
            'event'            => null,
            'created_at'       => $task->created_at,
        ], 201);
    }

    // PUT /api/tasks/{id}/complete
    public function markComplete($id)
    {
        $task = Task::findOrFail($id);
        $task->update(['status' => 'completed']);
        return response()->json(['id' => $task->id, 'status' => $task->status]);
    }

    // PUT /api/tasks/{id}
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $task->update($request->only(['title', 'description', 'due_date', 'status', 'priority']));
        return response()->json($task);
    }

    // DELETE /api/tasks/{id}
    public function destroy($id)
    {
        Task::findOrFail($id)->delete();
        return response()->json(['message' => 'Task deleted.']);
    }
}