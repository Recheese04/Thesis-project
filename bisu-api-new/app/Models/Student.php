<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $table = 'students';

    protected $fillable = [
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'course',
        'year_level',
        'contact_number',
        'department_id',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'student_id', 'id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function organizationMemberships()
    {
        return $this->hasMany(MemberOrganization::class, 'student_id', 'id');
    }

    public function organizations()
    {
        return $this->belongsToMany(
            Organization::class,
            'member_organizations',
            'student_id',
            'organization_id'
        )->withPivot('role', 'position', 'status', 'joined_date');
    }

    public function officerMemberships()
    {
        return $this->organizationMemberships()
            ->whereIn('role', ['officer', 'adviser'])
            ->where('status', 'active');
    }
}