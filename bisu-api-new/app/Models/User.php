<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // ✅ FIXED: Use password_hash, not password
    protected $fillable = [
        'email',
        'password_hash',  // ✅ This is the actual column name in your database
        'student_id',
        'user_type_id',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ✅ CRITICAL: Password accessors for Laravel Auth compatibility
    // These allow you to use $user->password while storing in password_hash column
    
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function getPasswordAttribute()
    {
        return $this->password_hash;
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['password_hash'] = $value;
    }

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
        return $query->where('user_type_id', 3)
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