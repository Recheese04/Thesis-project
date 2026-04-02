<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'group_chat_id',
        'sender_id',
        'message',
        'image_path',
        'is_edited',
    ];

    protected $casts = [
        'is_edited' => 'boolean',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function groupChat()
    {
        return $this->belongsTo(GroupChat::class, 'group_chat_id');
    }
}