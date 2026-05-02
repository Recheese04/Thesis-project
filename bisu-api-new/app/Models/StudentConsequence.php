<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentConsequence extends Model
{
    protected $fillable = [
        'consequence_rule_id',
        'user_id',
        'event_id',
        'type',
        'student_fee_id',
        'status',
        'due_date',
        'completed_at',
        'notes',
    ];

    public function financialFee()
    {
        return $this->belongsTo(StudentFee::class, 'student_fee_id');
    }

    public function rule()
    {
        return $this->belongsTo(ConsequenceRule::class, 'consequence_rule_id');
    }


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
