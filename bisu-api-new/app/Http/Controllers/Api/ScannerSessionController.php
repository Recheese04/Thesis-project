<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScannerSession;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScannerSessionController extends Controller
{
    /**
     * Start a new scanner session.
     * Officer selects an event → creates an active session.
     * Automatically ends any existing active session for this officer's org.
     */
    public function start(Request $request)
    {
        try {
            $data = $request->validate([
                'event_id' => 'required|exists:events,id',
                'device_id' => 'nullable|string',
            ]);

            $user = auth()->user();
            $event = Event::findOrFail($data['event_id']);

            // Verify this user is an officer of the event's organization
            if (!$user->isAdmin() && !$user->isOfficerOf($event->organization_id)) {
                return response()->json([
                    'message' => 'Unauthorized. You must be an officer of this organization.',
                ], 403);
            }

            // End any existing active sessions for this organization (or specific device)
            $query = ScannerSession::where('organization_id', $event->organization_id)->where('status', 'active');
            if (!empty($data['device_id'])) {
                $query->where('device_id', $data['device_id']);
            }
            $query->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);

            // Create new active session
            $session = ScannerSession::create([
                'event_id' => $event->id,
                'officer_user_id' => $user->id,
                'organization_id' => $event->organization_id,
                'device_id' => $data['device_id'] ?? null,
                'status' => 'active',
                'started_at' => now(),
            ]);

            $session->load(['event', 'officer', 'organization']);

            return response()->json([
                'message' => 'Scanner session started successfully!',
                'session' => [
                    'id' => $session->id,
                    'event_id' => $session->event_id,
                    'event_title' => $session->event->title ?? null,
                    'event_date' => $session->event->event_date ?? null,
                    'officer_name' => trim(($session->officer->first_name ?? '') . ' ' . ($session->officer->last_name ?? '')),
                    'officer_id' => $session->officer_user_id,
                    'organization_id' => $session->organization_id,
                    'organization_name' => $session->organization->name ?? null,
                    'device_id' => $session->device_id,
                    'status' => $session->status,
                    'started_at' => $session->started_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            Log::error('Scanner session start error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error starting scanner session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stop the active scanner session for the officer's organization.
     */
    public function stop(Request $request)
    {
        try {
            $user = auth()->user();
            $orgId = $user->getOfficerOrganizationId();

            if (!$orgId) {
                return response()->json([
                    'message' => 'You are not an officer of any organization.',
                ], 403);
            }

            $session = ScannerSession::where('organization_id', $orgId)
                ->where('status', 'active')
                ->first();

            if (!$session) {
                return response()->json([
                    'message' => 'No active scanner session found.',
                ], 404);
            }

            $session->status = 'ended';
            $session->ended_at = now();
            $session->save();

            return response()->json([
                'message' => 'Scanner session stopped.',
                'session' => [
                    'id' => $session->id,
                    'status' => 'ended',
                    'ended_at' => $session->ended_at,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner session stop error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error stopping scanner session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the current active scanner session for the officer's organization.
     */
    public function active(Request $request)
    {
        try {
            $user = auth()->user();
            $orgId = $user->getOfficerOrganizationId();

            if (!$orgId) {
                return response()->json([
                    'message' => 'You are not an officer of any organization.',
                ], 403);
            }

            $session = ScannerSession::with(['event', 'officer', 'organization'])
                ->where('organization_id', $orgId)
                ->where('status', 'active')
                ->first();

            if (!$session) {
                return response()->json([
                    'session' => null,
                    'message' => 'No active scanner session.',
                ]);
            }

            return response()->json([
                'session' => [
                    'id' => $session->id,
                    'event_id' => $session->event_id,
                    'event_title' => $session->event->title ?? null,
                    'event_date' => $session->event->event_date ?? null,
                    'officer_name' => trim(($session->officer->first_name ?? '') . ' ' . ($session->officer->last_name ?? '')),
                    'officer_id' => $session->officer_user_id,
                    'organization_id' => $session->organization_id,
                    'organization_name' => $session->organization->name ?? null,
                    'device_id' => $session->device_id,
                    'status' => $session->status,
                    'started_at' => $session->started_at,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner session active error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching active session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
