<?php

// ============================================================
// FILE: app/Models/ConsequenceRule.php
// ============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsequenceRule extends Model
{
    protected $table = 'consequence_rules';

    protected $fillable = [
        'organization_id',
        'event_id',
        'event_category',
        'consequence_title',
        'consequence_description',
        'due_days',
        'created_by',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
