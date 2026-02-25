<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';

    protected $fillable = [
        'organization_id',
        'title',
        'description',
        'event_date',
        'event_time',
        'end_time',
        'location',
        'qr_code',
        'status',
        'created_by',
    ];

    protected $casts = [
        'event_date' => 'date',
        // ✅ Use 'string' for TIME columns — NOT 'datetime:H:i'
        // 'datetime:H:i' is for full DATETIME columns and corrupts TIME values on save
        'event_time' => 'string',
        'end_time'   => 'string',
        'status'     => 'string',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendances()
    {
        return $this->hasMany(EventAttendance::class, 'event_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'upcoming')
                     ->where('event_date', '>=', now()->toDateString());
    }

    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('event_date', [$startDate, $endDate]);
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getFormattedDateAttribute(): ?string
    {
        return $this->event_date ? $this->event_date->format('F d, Y') : null;
    }

    /**
     * Returns formatted start time e.g. "2:09 PM"
     * Parses the raw "H:i:s" string from the TIME column manually.
     */
    public function getFormattedTimeAttribute(): ?string
    {
        if (!$this->event_time) return null;
        try {
            return \Carbon\Carbon::createFromFormat('H:i:s', $this->event_time)->format('h:i A');
        } catch (\Exception $e) {
            return $this->event_time;
        }
    }

    /**
     * Returns formatted end time e.g. "4:00 PM"
     */
    public function getFormattedEndTimeAttribute(): ?string
    {
        if (!$this->end_time) return null;
        try {
            return \Carbon\Carbon::createFromFormat('H:i:s', $this->end_time)->format('h:i A');
        } catch (\Exception $e) {
            return $this->end_time;
        }
    }

    public function getIsPastAttribute(): bool
    {
        return $this->event_date && $this->event_date->isPast();
    }
}