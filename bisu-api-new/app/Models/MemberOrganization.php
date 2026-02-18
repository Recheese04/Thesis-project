<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberOrganization extends Model
{
    use HasFactory;

    protected $table = 'member_organizations';

    protected $fillable = [
        'organization_id',
        'student_id',
        'role',
        'position',
        'joined_date',
        'status',
    ];
        
    protected $casts = [
        'joined_date' => 'date',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOfficers($query)
    {
        return $query->whereIn('role', ['officer', 'adviser']);
    }

    public function scopeMembers($query)
    {
        return $query->where('role', 'member');
    }
}