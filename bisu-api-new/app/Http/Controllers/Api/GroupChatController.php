<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupChat;
use App\Models\GroupChatMember;
use App\Models\MemberOrganization;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupChatController extends Controller
{
    // GET /api/group-chats
    public function index()
    {
        $user = Auth::user();

        $groups = GroupChat::whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['members.user.student', 'latestMessage.sender.student'])
            ->latest()
            ->get()
            ->map(fn($g) => $this->formatGroup($g));

        return response()->json(['groups' => $groups]);
    }

    // POST /api/group-chats
    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'member_ids'   => 'nullable|array',
            'member_ids.*' => 'integer',
            'avatar_color' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();

        $orgId = MemberOrganization::where('student_id', $user->student_id)
            ->value('organization_id');

        if (!$orgId) {
            return response()->json(['error' => 'User has no organization'], 422);
        }

        $group = GroupChat::create([
            'organization_id' => $orgId,
            'created_by'      => $user->id,
            'name'            => $request->name,
            'avatar_color'    => $request->avatar_color ?? 'from-violet-500 to-indigo-600',
        ]);

        // Creator is always admin
        GroupChatMember::create([
            'group_chat_id' => $group->id,
            'user_id'       => $user->id,
            'role'          => 'admin',
        ]);

        // Add invited members
        foreach ($request->member_ids ?? [] as $memberId) {
            if ($memberId != $user->id) {
                GroupChatMember::firstOrCreate(
                    ['group_chat_id' => $group->id, 'user_id' => $memberId],
                    ['role' => 'member']
                );
            }
        }

        $group->load('members.user.student', 'latestMessage');

        return response()->json(['group' => $this->formatGroup($group)], 201);
    }

    // PATCH /api/group-chats/{gc}
    public function update(Request $request, GroupChat $gc)
    {
        $this->authorizeAdmin($gc);

        $request->validate([
            'name'         => 'sometimes|string|max:100',
            'avatar_color' => 'sometimes|string|max:100',
        ]);

        $gc->update($request->only('name', 'avatar_color'));
        $gc->load('members.user.student', 'latestMessage');

        return response()->json(['group' => $this->formatGroup($gc)]);
    }

    // GET /api/group-chats/{gc}/messages
    public function messages(Request $request, GroupChat $gc)
    {
        $this->authorizeMember($gc);

        $query = Message::where('group_chat_id', $gc->id)
            ->with('sender.student')
            ->orderBy('id');

        if ($request->after_id) {
            $query->where('id', '>', (int) $request->after_id);
        }

        $messages = $query->get()->map(fn($m) => $this->formatMessage($m));

        return response()->json(['messages' => $messages]);
    }

    // POST /api/group-chats/{gc}/messages
    public function sendMessage(Request $request, GroupChat $gc)
    {
        $this->authorizeMember($gc);

        $request->validate([
            'message' => 'nullable|string|max:5000',
            'image'   => 'nullable|image|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('messages/' . date('Y/m'), 'public');
        }

        $msg = Message::create([
            'organization_id' => $gc->organization_id,
            'group_chat_id'   => $gc->id,
            'sender_id'       => Auth::id(),
            'receiver_id'     => null,
            'message'         => $request->message ?? '',
            'image_path'      => $imagePath,
        ]);

        $msg->load('sender.student');

        return response()->json(['message' => $this->formatMessage($msg)], 201);
    }

    // POST /api/group-chats/{gc}/members
    public function addMembers(Request $request, GroupChat $gc)
    {
        $this->authorizeAdmin($gc);

        $request->validate([
            'user_ids'   => 'required|array',
            'user_ids.*' => 'integer',
        ]);

        foreach ($request->user_ids as $userId) {
            GroupChatMember::firstOrCreate(
                ['group_chat_id' => $gc->id, 'user_id' => $userId],
                ['role' => 'member']
            );
        }

        $gc->load('members.user.student');

        return response()->json(['group' => $this->formatGroup($gc)]);
    }

    // DELETE /api/group-chats/{gc}/members/{userId}
    public function removeMember(GroupChat $gc, $userId)
    {
        $authUser = Auth::user();
        $isAdmin  = $gc->members()->where('user_id', $authUser->id)->where('role', 'admin')->exists();
        $isSelf   = $authUser->id == $userId;

        if (!$isAdmin && !$isSelf) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $gc->members()->where('user_id', $userId)->delete();

        // Clean up empty groups
        if ($gc->members()->count() === 0) {
            $gc->delete();
        }

        return response()->json(['message' => 'Removed']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeMember(GroupChat $gc): void
    {
        if (!$gc->members()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Not a member of this group');
        }
    }

    private function authorizeAdmin(GroupChat $gc): void
    {
        if (!$gc->members()->where('user_id', Auth::id())->where('role', 'admin')->exists()) {
            abort(403, 'Not an admin of this group');
        }
    }

    private function resolveUserName($user): string
    {
        if (!$user) return 'Unknown';
        $student = $user->student;
        if ($student) {
            return trim($student->first_name . ' ' . $student->last_name);
        }
        return $user->email;
    }

    private function formatGroup(GroupChat $group): array
    {
        $latest = $group->latestMessage;
        return [
            'id'           => $group->id,
            'name'         => $group->name,
            'avatar_color' => $group->avatar_color,
            'created_by'   => $group->created_by,
            'last_message' => $latest
                ? ($latest->image_path ? '📷 Image' : $latest->message)
                : null,
            'last_time'    => $latest?->created_at,
            'members'      => $group->members->map(fn($m) => [
                'id'   => $m->user_id,
                'name' => $this->resolveUserName($m->user),
                'role' => $m->role,
            ])->values(),
        ];
    }

    private function formatMessage(Message $m): array
    {
        return [
            'id'         => $m->id,
            'message'    => $m->message,
            'image_url'  => $m->image_path
                ? asset('storage/' . $m->image_path)
                : null,
            'created_at' => $m->created_at,
            'sender_id'  => $m->sender_id,
            'sender'     => $m->sender ? [
                'id'   => $m->sender->id,
                'name' => $this->resolveUserName($m->sender),
            ] : null,
        ];
    }
}