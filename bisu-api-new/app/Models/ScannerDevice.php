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

    // ── Scopes ───────────────────────────────────────────────────────

    public function scopeForOrganization($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }
}
