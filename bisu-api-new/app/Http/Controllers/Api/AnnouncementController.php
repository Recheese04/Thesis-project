<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Designation;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * List announcements for a specific organization.
     * Pinned first, then newest first.
     */
    public function index(Request $request, $orgId)
    {
        $announcements = Announcement::with(['creator:id,first_name,last_name'])
            ->where('organization_id', $orgId)
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($announcements);
    }

    /**
     * Create a new announcement (officer only).
     */
    public function store(Request $request, $orgId)
    {
        $user = $request->user();
        if (!$user->isOfficerOf($orgId)) {
            return response()->json(['message' => 'Unauthorized. Only officers can create announcements.'], 403);
        }

        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'organization_id' => $orgId,
            'created_by'      => $user->id,
            'title'           => $data['title'],
            'content'         => $data['content'],
        ]);

        $announcement->load('creator:id,first_name,last_name');

        return response()->json($announcement, 201);
    }

    /**
     * Update an announcement (officer only).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        if (!$user->isOfficerOf($announcement->organization_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $announcement->update($data);
        $announcement->load('creator:id,first_name,last_name');

        return response()->json($announcement);
    }

    /**
     * Toggle pin status (officer only).
     */
    public function togglePin(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        if (!$user->isOfficerOf($announcement->organization_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcement->update(['is_pinned' => !$announcement->is_pinned]);
        $announcement->load('creator:id,first_name,last_name');

        return response()->json($announcement);
    }

    /**
     * Delete an announcement (officer only).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        if (!$user->isOfficerOf($announcement->organization_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }

    /**
     * Student view: all announcements from organisations the student belongs to.
     */
    public function studentIndex(Request $request)
    {
        $user = $request->user();

        $orgIds = Designation::where('user_id', $user->id)
            ->where('status', 'active')
            ->pluck('organization_id');

        $announcements = Announcement::with([
                'creator:id,first_name,last_name',
                'organization:id,name',
            ])
            ->whereIn('organization_id', $orgIds)
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($announcements);
    }
}
