<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $table = 'students';
    protected $primaryKey = 'id';

    protected $fillable = [
        'student_id',      // varchar - human-readable like "2024-00001"
        'first_name',
        'last_name',
        'middle_name',
        'year_level',
        'department_id',
        'course',          // Direct course name (no program_id FK)
        'contact_number',
        'address',
    ];

    protected $casts = [
        'year_level' => 'string',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    /**
     * The user account associated with this student.
     * users.student_id (FK) → students.id (PK)
     */
    public function user()
    {
        return $this->hasOne(User::class, 'student_id', 'id');
    }

    /**
     * The department this student belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Attendance records for this student.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id', 'id');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    /**
     * Get the student's full name.
     */
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);
        return implode(' ', $parts);
    }

    /**
     * Get the student's full name (first + last only).
     */
    public function getNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    /**
     * Return program data in expected format (since we're using course string).
     */
    public function getProgramAttribute()
    {
        if (!$this->course) {
            return null;
        }

        return (object) [
            'id' => null,
            'name' => $this->course,
            'code' => null,
        ];
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Filter students by year level.
     */
    public function scopeByYearLevel($query, string $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    /**
     * Filter students by department.
     */
    public function scopeByDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Filter students by course name.
     */
    public function scopeByCourse($query, string $course)
    {
        return $query->where('course', $course);
    }

    /**
     * Search students by name or student ID.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('first_name', 'LIKE', "%{$term}%")
              ->orWhere('last_name', 'LIKE', "%{$term}%")
              ->orWhere('student_id', 'LIKE', "%{$term}%")
              ->orWhere('course', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Only active students (those with active user accounts).
     */
    public function scopeActive($query)
    {
        return $query->whereHas('user', function ($q) {
            $q->where('is_active', true);
        });
    }
}