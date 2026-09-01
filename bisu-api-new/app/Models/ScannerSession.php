<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScannerSession extends Model
{
    protected $fillable = [
        'event_id',
        'officer_user_id',
        'organization_id',
        'device_id',
        'status',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    // ── Scopes ───────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForOrganization($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }
}
