<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupChatMember extends Model
{
    protected $fillable = [
        'group_chat_id',
        'user_id',
        'role',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function groupChat()
    {
        return $this->belongsTo(GroupChat::class);
    }
}