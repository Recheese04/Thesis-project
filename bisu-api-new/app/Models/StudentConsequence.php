<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentConsequence extends Model
{
    protected $fillable = [
        'consequence_rule_id',
        'user_id',
        'event_id',
        'status',
        'due_date',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    public function consequenceRule()
    {
        return $this->belongsTo(ConsequenceRule::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
