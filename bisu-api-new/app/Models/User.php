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
        'password_hash',
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

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function userType()
    {
        return $this->belongsTo(UserType::class, 'user_type_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'student_id', 'student_id');
    }

    public function isAdmin(): bool
    {
        return is_null($this->student_id);
    }

    public function getOfficerMembership(): ?MemberOrganization
    {
        if (!$this->student_id) return null;

        return MemberOrganization::where('student_id', $this->student_id)
            ->whereIn('role', ['officer', 'adviser'])
            ->where('status', 'active')
            ->first();
    }

    public function getOfficerOrganizationId(): ?int
    {
        return $this->getOfficerMembership()?->organization_id;
    }

    public function isOfficer(): bool
    {
        return $this->getOfficerOrganizationId() !== null;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStudents($query)
    {
        return $query->whereNotNull('student_id');
    }
}