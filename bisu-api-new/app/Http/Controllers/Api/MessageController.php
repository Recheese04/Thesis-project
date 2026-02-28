<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MemberOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    // ── helpers ──────────────────────────────────────────────────────────────

    private function resolveOrgId(): ?int
    {
        $user = Auth::user();
        return $user->getOfficerOrganizationId()
            ?? (request()->integer('organization_id') ?: null);
    }

    private function fmt(Message $m): array
    {
        $student = $m->sender?->student;
        return [
            'id'          => $m->id,
            'message'     => $m->message,
            'image_url'   => $m->image_path
                                ? Storage::url($m->image_path)
                                : null,
            'sender_id'   => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'sender_name' => $student
                                ? trim($student->first_name . ' ' . $student->last_name)
                                : 'Admin',
            'created_at'  => $m->created_at->toIso8601String(),
        ];
    }

    // ── GET /api/messages ─────────────────────────────────────────────────────
    // ?type=group               — org group chat
    // ?type=pm&with=<user_id>   — PM thread
    // ?after_id=<id>            — polling: only newer messages
    public function index(Request $request): JsonResponse
    {
        $me    = Auth::user();
        $orgId = $this->resolveOrgId();
        if (!$orgId) return response()->json(['message' => 'Forbidden'], 403);

        $type = $request->input('type', 'group');

        $query = Message::with('sender.student')
            ->where('organization_id', $orgId)
            ->orderBy('created_at', 'asc');

        if ($type === 'pm') {
            $request->validate(['with' => 'required|integer|exists:users,id']);
            $query->pmThread($me->id, (int) $request->with);
        } else {
            $query->group();
        }

        if ($request->filled('after_id')) {
            $query->where('id', '>', (int) $request->after_id);
        }

        return response()->json([
            'messages' => $query->get()->map(fn($m) => $this->fmt($m)),
        ]);
    }

    // ── POST /api/messages ────────────────────────────────────────────────────
    // Body (multipart/form-data):
    //   message     string  (required if no image)
    //   image       file    (optional, jpg/png/gif/webp, max 5 MB)
    //   type        group|pm  (default: group)
    //   receiver_id integer (required when type=pm)
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message'     => ['nullable', 'string', 'max:2000'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:5120'],
            'type'        => ['sometimes', 'in:group,pm'],
            'receiver_id' => ['required_if:type,pm', 'nullable', 'integer', 'exists:users,id'],
        ]);

        if (!$request->filled('message') && !$request->hasFile('image')) {
            return response()->json(['message' => 'Send a message or image.'], 422);
        }

        $orgId = $this->resolveOrgId();
        if (!$orgId) return response()->json(['message' => 'Forbidden'], 403);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store('messages/' . date('Y/m'), 'public');
        }

        $msg = Message::create([
            'organization_id' => $orgId,
            'sender_id'       => Auth::id(),
            'receiver_id'     => $request->input('type') === 'pm'
                                    ? (int) $request->receiver_id
                                    : null,
            'message'         => $request->input('message', ''),
            'image_path'      => $imagePath,
        ]);

        $msg->load('sender.student');

        return response()->json(['message' => $this->fmt($msg)], 201);
    }

    // ── GET /api/messages/members ─────────────────────────────────────────────
    // Returns active org members with last-PM-message preview per member.
    public function members(): JsonResponse
    {
        $me    = Auth::user();
        $orgId = $this->resolveOrgId();
        if (!$orgId) return response()->json(['message' => 'Forbidden'], 403);

        $memberships = MemberOrganization::with('student.user')
            ->where('organization_id', $orgId)
            ->where('status', 'active')
            ->get();

        $members = $memberships->map(function ($mo) use ($me, $orgId) {
            $student = $mo->student;
            $user    = $student?->user;
            if (!$user) return null;

            // Last PM message in this thread
            $last = Message::where('organization_id', $orgId)
                ->pmThread($me->id, $user->id)
                ->orderByDesc('created_at')
                ->first();

            // Unread count (messages they sent to me that I haven't "read")
            // Simple approach: count all their messages since last_read.
            // For now just returning total for the thread.
            $unread = Message::where('organization_id', $orgId)
                ->where('sender_id', $user->id)
                ->where('receiver_id', $me->id)
                ->count();

            return [
                'id'           => $user->id,
                'student_id'   => $student->id,
                'name'         => trim($student->first_name . ' ' . $student->last_name),
                'role'         => ucfirst($mo->role),
                'position'     => $mo->position,
                'student_no'   => $student->student_number,
                'last_message' => $last ? ($last->image_path ? '📷 Image' : $last->message) : null,
                'last_time'    => $last?->created_at->toIso8601String(),
                'unread'       => $unread,
            ];
        })->filter()->values();

        return response()->json(['members' => $members]);
    }
}