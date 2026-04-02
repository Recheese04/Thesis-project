<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DirectMessage extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
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

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Scope to get a PM thread between two users (both directions).
     */
    public function scopeThread($query, int $userA, int $userB)
    {
        return $query->where(function ($q) use ($userA, $userB) {
            $q->where(fn($s) => $s->where('sender_id', $userA)->where('receiver_id', $userB))
              ->orWhere(fn($s) => $s->where('sender_id', $userB)->where('receiver_id', $userA));
        });
    }
}
