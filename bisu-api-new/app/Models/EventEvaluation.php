<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventEvaluation extends Model
{
    use HasFactory;

    protected $table = 'event_evaluations';

    protected $fillable = [
        'event_id',
        'title',
        'description',
        'is_anonymous',
        'status',
        'created_by',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions()
    {
        return $this->hasMany(EvaluationQuestion::class, 'evaluation_id')->orderBy('order_index');
    }

    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class, 'evaluation_id');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getIsOpenAttribute()
    {
        return $this->status === 'open';
    }

    public function getTotalResponsesAttribute()
    {
        return $this->responses()->count();
    }
}