<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $table = 'organizations';

    protected $fillable = [
        'department_id',
        'name',
        'type',
        'scope',        // NEW: department, location, or independent
        'location',     // NEW: for location-based organizations
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
        'type' => 'string',
        'scope' => 'string',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function members()
    {
        return $this->hasMany(MemberOrganization::class, 'organization_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'organization_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'organization_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'organization_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'organization_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Scope to get only department-based organizations
     */
    public function scopeDepartmentBased($query)
    {
        return $query->where('scope', 'department');
    }

    /**
     * Scope to get only location-based organizations
     */
    public function scopeLocationBased($query)
    {
        return $query->where('scope', 'location');
    }

    /**
     * Scope to get only independent organizations
     */
    public function scopeIndependent($query)
    {
        return $query->where('scope', 'independent');
    }
}