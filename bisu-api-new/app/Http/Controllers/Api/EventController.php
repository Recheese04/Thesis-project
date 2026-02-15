<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EventController extends Controller
{
    // ── GET /api/events ────────────────────────────────────────────────────
    public function index()
    {
        try {
            $events = Event::with(['organization.department'])
                ->orderBy('event_date', 'desc')
                ->orderBy('event_time', 'desc')
                ->get();

            return response()->json($events);
        } catch (\Exception $e) {
            Log::error('Event index error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching events',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/events/{id} ───────────────────────────────────────────────
    public function show($id)
    {
        try {
            $event = Event::with(['organization.department'])
                ->findOrFail($id);

            return response()->json($event);
        } catch (\Exception $e) {
            Log::error('Event show error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Event not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // ── POST /api/events ───────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'organization_id' => 'required|exists:organizations,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'event_date' => 'required|date',
                'event_time' => 'nullable|date_format:H:i',
                'location' => 'nullable|string|max:255',
                'status' => 'nullable|in:upcoming,ongoing,completed,cancelled',
            ]);

            // Set default status if not provided
            $data['status'] = $data['status'] ?? 'upcoming';

            // Generate QR code (you can customize this logic)
            $data['qr_code'] = Str::uuid()->toString();

            // Set created_by to authenticated user
            $data['created_by'] = auth()->id();

            $event = Event::create($data);

            // Load relationships
            $event->load(['organization.department']);

            return response()->json([
                'message' => 'Event has been created successfully!',
                'event' => $event
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Event store error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error creating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/events/{id} ───────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $event = Event::findOrFail($id);

            $data = $request->validate([
                'organization_id' => 'required|exists:organizations,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'event_date' => 'required|date',
                'event_time' => 'nullable|date_format:H:i',
                'location' => 'nullable|string|max:255',
                'status' => 'nullable|in:upcoming,ongoing,completed,cancelled',
            ]);

            $event->update($data);

            // Load relationships
            $event->load(['organization.department']);

            return response()->json([
                'message' => 'Event has been updated successfully!',
                'event' => $event
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Event update error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error updating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/events/{id} ────────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $event = Event::findOrFail($id);
            $event->delete();

            return response()->json([
                'message' => 'Event deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Event delete error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error deleting event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/events/{id}/qr ────────────────────────────────────────────
    public function getQRCode($id)
    {
        try {
            $event = Event::findOrFail($id);
            
            // You can return the QR code URL or generate one here
            // For now, returning the QR code string
            return response()->json([
                'qr_code' => $event->qr_code,
                'event' => $event->title
            ]);
        } catch (\Exception $e) {
            Log::error('Event QR code error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/events/upcoming ───────────────────────────────────────────
    public function upcoming()
    {
        try {
            $events = Event::with(['organization.department'])
                ->where('status', 'upcoming')
                ->where('event_date', '>=', now()->toDateString())
                ->orderBy('event_date', 'asc')
                ->orderBy('event_time', 'asc')
                ->get();

            return response()->json($events);
        } catch (\Exception $e) {
            Log::error('Upcoming events error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching upcoming events',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}