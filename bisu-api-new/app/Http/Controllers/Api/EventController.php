<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EventController extends Controller
{
    /**
     * Auto-update event statuses using raw MySQL NOW() to avoid
     * any PHP timezone mismatch issues.
     */
    private function syncEventStatuses(): void
    {
        try {
            // Step 1: Mark as completed when end_time has passed
            DB::statement("
                UPDATE events
                SET status = 'completed', updated_at = NOW()
                WHERE status IN ('upcoming', 'ongoing')
                  AND event_date IS NOT NULL
                  AND end_time IS NOT NULL
                  AND CONCAT(event_date, ' ', end_time) <= NOW()
            ");

            // Step 2: Mark as ongoing when start time passed but not yet ended
            DB::statement("
                UPDATE events
                SET status = 'ongoing', updated_at = NOW()
                WHERE status = 'upcoming'
                  AND event_date IS NOT NULL
                  AND event_time IS NOT NULL
                  AND CONCAT(event_date, ' ', event_time) <= NOW()
                  AND (
                      end_time IS NULL
                      OR CONCAT(event_date, ' ', end_time) > NOW()
                  )
            ");

        } catch (\Exception $e) {
            Log::error('Event status sync error: ' . $e->getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        try {
            $this->syncEventStatuses();

            $user  = auth()->user();
            $query = Event::with(['organization.department'])
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc');

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if ($orgId) {
                    $query->where('organization_id', $orgId);
                }
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            Log::error('Event index error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching events', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $event = Event::with(['organization.department'])->findOrFail($id);
            return response()->json($event);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Event not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = auth()->user();

            if ($user->isAdmin()) {
                return response()->json(['message' => 'Only officers can create events.'], 403);
            }

            $orgId = $user->getOfficerOrganizationId();
            if (!$orgId) {
                return response()->json(['message' => 'You are not an active officer of any organization.'], 403);
            }

            $data = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'event_date'  => 'required|date',
                'event_time'  => 'nullable|date_format:H:i',
                'end_time'    => 'nullable|date_format:H:i|after:event_time',
                'location'    => 'nullable|string|max:255',
                'status'      => 'nullable|in:upcoming,ongoing,completed,cancelled',
            ]);

            $data['organization_id'] = $orgId;
            $data['status']          = $data['status'] ?? 'upcoming';
            $data['qr_code']         = Str::uuid()->toString();
            $data['created_by']      = $user->id;

            $event = Event::create($data);
            $event->load(['organization.department']);

            return response()->json([
                'message' => 'Event has been created successfully!',
                'event'   => $event,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Event store error: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating event', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user  = auth()->user();
            $event = Event::findOrFail($id);

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if (!$orgId || $event->organization_id !== $orgId) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $data = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'event_date'  => 'required|date',
                'event_time'  => 'nullable|date_format:H:i',
                'end_time'    => 'nullable|date_format:H:i|after:event_time',
                'location'    => 'nullable|string|max:255',
                'status'      => 'nullable|in:upcoming,ongoing,completed,cancelled',
            ]);

            $event->update($data);
            $event->load(['organization.department']);

            return response()->json([
                'message' => 'Event has been updated successfully!',
                'event'   => $event,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Event update error: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating event', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user  = auth()->user();
            $event = Event::findOrFail($id);

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if (!$orgId || $event->organization_id !== $orgId) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $event->delete();
            return response()->json(['message' => 'Event deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Event delete error: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting event', 'error' => $e->getMessage()], 500);
        }
    }

    public function getQRCode($id)
    {
        try {
            $event = Event::findOrFail($id);
            return response()->json(['qr_code' => $event->qr_code, 'event' => $event->title]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching QR code'], 500);
        }
    }

    public function upcoming()
    {
        try {
            $this->syncEventStatuses();

            $user  = auth()->user();
            $query = Event::with(['organization.department'])
                ->where('status', 'ongoing')
                ->orderBy('event_date', 'asc')
                ->orderBy('event_time', 'asc');

            if (!$user->isAdmin()) {
                $orgId = $user->getOfficerOrganizationId();
                if ($orgId) {
                    $query->where('organization_id', $orgId);
                }
            }

            return response()->json($query->get());
        } catch (\Exception $e) {
            Log::error('Upcoming events error: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching upcoming events'], 500);
        }
    }

   
}