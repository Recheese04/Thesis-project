<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $table = 'organizations';

    protected $fillable = [
        'college_id',
        'name',
        'type',
        'scope',
        'location',
        'description',
        'status',
        'invite_code',
    ];

    protected $casts = [
        'status' => 'string',
        'type'   => 'string',
        'scope'  => 'string',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function college()
    {
        return $this->belongsTo(College::class, 'college_id');
    }

    /**
     */
    public function members()
    {
        return $this->hasMany(Designation::class, 'organization_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'organization_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'organization_id');
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

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCollegeBased($query)
    {
        return $query->where('scope', 'college');
    }

    public function scopeLocationBased($query)
    {
        return $query->where('scope', 'location');
    }

    public function scopeIndependent($query)
    {
        return $query->where('scope', 'independent');
    }
}