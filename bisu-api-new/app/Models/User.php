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
        'user_type_id',
        'is_active',
        'student_number',
        'first_name',
        'middle_name',
        'last_name',
        'year_level',
        'contact_number',
        'college_id',
        'course_id',
        'rfid_uid',
        'profile_picture',
        'address_id',
        'is_deleted',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_deleted' => 'boolean',
    ];

    protected $appends = ['profile_picture_url'];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function getProfilePictureUrlAttribute()
    {
        if ($this->profile_picture) {
            return asset('storage/' . $this->profile_picture);
        }
        return null;
    }

    public function userType()
    {
        return $this->belongsTo(UserType::class, 'user_type_id');
    }

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function designations()
    {
        return $this->hasMany(Designation::class, 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->user_type_id === 1;
    }

    public function getOfficerDesignation(): ?Designation
    {
        if ($this->isAdmin()) return null;

        return Designation::where('user_id', $this->id)
            ->whereNotIn('designation', ['Member'])
            ->where('status', 'active')
            ->first();
    }

    public function getOfficerOrganizationId(): ?int
    {
        // If the frontend explicitly requested data for an org they manage, respect it
        $headerOrgId = request()->header('X-Organization-Id');
        if ($headerOrgId && $this->isOfficerOf($headerOrgId)) {
            return (int) $headerOrgId;
        }

        // Fallback to their primary/first active officer org
        return $this->getOfficerDesignation()?->organization_id;
    }

    public function isOfficer(): bool
    {
        return $this->getOfficerOrganizationId() !== null;
    }

    public function isOfficerOf($organizationId): bool
    {
        if ($this->isAdmin()) return true;
        if (!$organizationId) return false;

        return Designation::where('user_id', $this->id)
            ->where('organization_id', $organizationId)
            ->whereNotIn('designation', ['Member'])
            ->where('status', 'active')
            ->exists();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStudents($query)
    {
        return $query->whereNotNull('student_number');
    }
}