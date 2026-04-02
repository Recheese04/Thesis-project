<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationResponse extends Model
{
    use HasFactory;

    protected $table = 'evaluation_responses';

    public $timestamps = false;

    protected $fillable = [
        'evaluation_id',
        'user_id',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function evaluation()
    {
        return $this->belongsTo(EventEvaluation::class, 'evaluation_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function answers()
    {
        return $this->hasMany(EvaluationAnswer::class, 'response_id');
    }
}