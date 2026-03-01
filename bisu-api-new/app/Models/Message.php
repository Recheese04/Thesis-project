<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'organization_id',
        'group_chat_id',
        'sender_id',
        'receiver_id',
        'message',
        'image_path',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id')->with('student');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function scopeGroup($query)
    {
        return $query->whereNull('receiver_id')->whereNull('group_chat_id');
    }

    public function scopePmThread($query, int $userA, int $userB)
    {
        return $query->where(function ($q) use ($userA, $userB) {
            $q->where(fn($s) => $s->where('sender_id', $userA)->where('receiver_id', $userB))
              ->orWhere(fn($s) => $s->where('sender_id', $userB)->where('receiver_id', $userA));
        });
    }
}