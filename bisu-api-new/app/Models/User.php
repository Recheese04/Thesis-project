<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'student_id',        // bigint FK → students.id (PK)
        'user_type_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    /**
     * The student profile associated with this user.
     * users.student_id (FK) → students.id (PK)
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    /**
     * User type relationship (Admin/Officer/Member).
     */
    public function userType()
    {
        return $this->belongsTo(UserType::class, 'user_type_id');
    }

    /**
     * Attendance records for this user.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id', 'student_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Scope to filter only students (members).
     */
    public function scopeStudents($query)
    {
        return $query->where('user_type_id', 3) // Assuming 3 = Member/Student
                     ->whereNotNull('student_id');
    }

    /**
     * Scope to filter active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}