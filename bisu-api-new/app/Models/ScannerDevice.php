<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ScannerDevice extends Model
{
    protected $fillable = [
        'device_id',
        'name',
        'organization_id',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function sessions()
    {
        return $this->hasMany(ScannerSession::class, 'device_id', 'device_id');
    }

    // ── Accessors ────────────────────────────────────────────────────

    /**
     * A scanner is considered "online" if it pinged within the last 3 minutes.
     */
    public function getIsOnlineAttribute(): bool
    {
        if (!$this->last_seen_at) return false;
        return $this->last_seen_at->greaterThan(Carbon::now()->subMinutes(3));
    }

    // ── Scopes ───────────────────────────────────────────────────────

    public function scopeForOrganization($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }

    public function scopeOnline($query)
    {
        return $query->where('last_seen_at', '>=', Carbon::now()->subMinutes(3));
    }
}
