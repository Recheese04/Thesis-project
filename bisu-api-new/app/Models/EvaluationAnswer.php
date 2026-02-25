<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationAnswer extends Model
{
    use HasFactory;

    protected $table = 'evaluation_answers';

    public $timestamps = false;

    protected $fillable = [
        'response_id',
        'question_id',
        'rating_value',
        'text_value',
        'option_id',
        'yes_no_value',
    ];

    protected $casts = [
        'rating_value' => 'integer',
        'yes_no_value' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function response()
    {
        return $this->belongsTo(EvaluationResponse::class, 'response_id');
    }

    public function question()
    {
        return $this->belongsTo(EvaluationQuestion::class, 'question_id');
    }

    public function selectedOption()
    {
        return $this->belongsTo(EvaluationQuestionOption::class, 'option_id');
    }
}