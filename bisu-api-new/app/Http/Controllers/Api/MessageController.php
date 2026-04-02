<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DirectMessage;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    // ── helpers ──────────────────────────────────────────────────────────────

    private function resolveOrgId(): ?int
    {
        $user = Auth::user();

        if ($id = request()->integer('organization_id') ?: null) {
            $isMemberOrOfficer = Designation::where('user_id', $user->id)
                ->where('organization_id', $id)
                ->where('status', 'active')
                ->exists();
            if ($isMemberOrOfficer || $user->isAdmin()) {
                return $id;
            }
        }

        if ($id = $user->getOfficerOrganizationId()) {
            return $id;
        }

        if ($user->id) {
            $membership = Designation::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();
            return $membership?->organization_id;
        }

        return null;
    }

    private function fmtDm(DirectMessage $m): array
    {
        $sender = $m->sender;
        return [
            'id'          => $m->id,
            'message'     => $m->message,
            'image_url'   => $m->image_path
                                ? Storage::url($m->image_path)
                                : null,
            'sender_id'   => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'sender_name' => $sender
                                ? trim($sender->first_name . ' ' . $sender->last_name)
                                : 'Admin',
            'created_at'  => $m->created_at->toIso8601String(),
            'is_edited'   => (bool) $m->is_edited,
        ];
    }

    // ── GET /api/messages ─────────────────────────────────────────────────────
    // ?type=pm&with=<user_id>   — PM thread
    // ?after_id=<id>            — polling: only newer messages
    public function index(Request $request): JsonResponse
    {
        $me = Auth::user();

        $type = $request->input('type', 'pm');

        if ($type === 'pm') {
            $request->validate(['with' => 'required|integer|exists:users,id']);

            $query = DirectMessage::with('sender')
                ->thread($me->id, (int) $request->with)
                ->orderBy('created_at', 'asc');

            if ($request->filled('after_id')) {
                $query->where('id', '>', (int) $request->after_id);
            }

            return response()->json([
                'messages' => $query->get()->map(fn($m) => $this->fmtDm($m)),
            ]);
        }

        // Group chat messages should go through GroupChatController
        return response()->json(['message' => 'Use /api/group-chats/{id}/messages for group chat.'], 400);
    }

    // ── POST /api/messages ────────────────────────────────────────────────────
    // Body (multipart/form-data):
    //   message      string  (required if no image)
    //   image        file    (optional, jpg/png/gif/webp, max 5 MB)
    //   receiver_id  integer (required — this is for DMs only)
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message'     => ['nullable', 'string', 'max:2000'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:5120'],
            'receiver_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        if (!$request->filled('message') && !$request->hasFile('image')) {
            return response()->json(['message' => 'Send a message or image.'], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store('messages/' . date('Y/m'), 'public');
        }

        $msg = DirectMessage::create([
            'sender_id'   => Auth::id(),
            'receiver_id' => (int) $request->receiver_id,
            'message'     => $request->input('message', ''),
            'image_path'  => $imagePath,
        ]);

        $msg->load('sender');

        return response()->json(['message' => $this->fmtDm($msg)], 201);
    }

    // ── PATCH /api/messages/{id} ──────────────────────────────────────────────
    public function update(Request $request, $id): JsonResponse
    {
        $dm = DirectMessage::findOrFail($id);

        if ($dm->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized to edit this message.'], 403);
        }

        $request->validate([
            'message'      => ['nullable', 'string', 'max:2000'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $changes = [];

        if ($request->has('message') && $request->input('message') !== $dm->message) {
            $changes['message'] = $request->input('message');
            $changes['is_edited'] = true;
        }

        if ($request->boolean('remove_image') && $dm->image_path) {
            Storage::disk('public')->delete($dm->image_path);
            $changes['image_path'] = null;
        }

        if (empty($changes)) {
            return response()->json(['message' => $this->fmtDm($dm)]);
        }

        $dm->update($changes);

        if (empty($dm->message) && empty($dm->image_path)) {
            $dm->delete();
            return response()->json(['message' => 'deleted']);
        }

        return response()->json(['message' => $this->fmtDm($dm)]);
    }

    // ── DELETE /api/messages/{id} ─────────────────────────────────────────────
    public function destroy($id): JsonResponse
    {
        $dm = DirectMessage::findOrFail($id);

        if ($dm->sender_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized to delete this message.'], 403);
        }

        if ($dm->image_path) {
            Storage::disk('public')->delete($dm->image_path);
        }

        $dm->delete();

        return response()->json(['message' => 'deleted']);
    }

    // ── GET /api/messages/members ─────────────────────────────────────────────
    // Returns active org members with last-DM preview per member.
    public function members(): JsonResponse
    {
        $me    = Auth::user();
        $orgId = $this->resolveOrgId();
        if (!$orgId) return response()->json(['message' => 'Forbidden'], 403);

        $memberships = Designation::with('user')
            ->where('organization_id', $orgId)
            ->where('status', 'active')
            ->get();

        $members = $memberships->map(function ($mo) use ($me) {
            $user = $mo->user;
            if (!$user) return null;

            // Last DM in this thread
            $last = DirectMessage::thread($me->id, $user->id)
                ->orderByDesc('created_at')
                ->first();

            // Unread count (messages they sent to me)
            $unread = DirectMessage::where('sender_id', $user->id)
                ->where('receiver_id', $me->id)
                ->count();

            return [
                'id'           => $user->id,
                'student_id'   => $user->id,
                'name'         => trim($user->first_name . ' ' . $user->last_name),
                'role'         => ucfirst($mo->role ?? $mo->designation),
                'position'     => $mo->position ?? $mo->designation,
                'student_no'   => $user->student_number,
                'last_message' => $last ? ($last->image_path ? '📷 Image' : $last->message) : null,
                'last_time'    => $last?->created_at->toIso8601String(),
                'unread'       => $unread,
            ];
        })->filter()->values();

        return response()->json(['members' => $members]);
    }
}