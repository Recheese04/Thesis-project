<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'tasks';

    protected $fillable = [
        'organization_id',
        'assigned_to',
        'assigned_by',
        'title',
        'description',
        'due_date',
        'status',
        'type',
        'priority',
        'event_id',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}