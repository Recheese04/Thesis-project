<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentClearance extends Model
{
    protected $table = 'student_clearances';

    protected $fillable = [
        'student_id',
        'organization_id',
        'requirement_id',
        'status',
        'notes',
        'cleared_by',
        'cleared_at',
        'school_year',
        'semester',
        'school_year_id',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function requirement()
    {
        return $this->belongsTo(ClearanceRequirement::class, 'requirement_id');
    }

    public function clearedBy()
    {
        return $this->belongsTo(User::class, 'cleared_by');
    }

    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }
}

