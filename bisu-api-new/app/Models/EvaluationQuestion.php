<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationQuestion extends Model
{
    use HasFactory;

    protected $table = 'evaluation_questions';

    protected $fillable = [
        'evaluation_id',
        'question_text',
        'question_type',
        'is_required',
        'order_index',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function evaluation()
    {
        return $this->belongsTo(EventEvaluation::class, 'evaluation_id');
    }

    public function options()
    {
        return $this->hasMany(EvaluationQuestionOption::class, 'question_id')->orderBy('order_index');
    }

    public function answers()
    {
        return $this->hasMany(EvaluationAnswer::class, 'question_id');
    }
}