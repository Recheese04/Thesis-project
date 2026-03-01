<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupChat extends Model
{
    protected $fillable = [
        'organization_id',
        'created_by',
        'name',
        'avatar_color',
    ];

    public function members()
    {
        return $this->hasMany(GroupChatMember::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'group_chat_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class, 'group_chat_id')->latestOfMany();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}