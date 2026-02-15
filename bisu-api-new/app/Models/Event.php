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
        'location',
        'qr_code',
        'status',
        'created_by',
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_time' => 'datetime:H:i',
        'status' => 'string',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    /**
     * Get the organization that owns this event
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    /**
     * Get the user who created this event
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get event attendees (if you have an attendance system)
     */
    public function attendances()
    {
        return $this->hasMany(EventAttendance::class, 'event_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Scope to get only upcoming events
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'upcoming')
                     ->where('event_date', '>=', now()->toDateString());
    }

    /**
     * Scope to get only ongoing events
     */
    public function scopeOngoing($query)
    {
        return $query->where('status', 'ongoing');
    }

    /**
     * Scope to get only completed events
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to get events by organization
     */
    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Scope to get events in date range
     */
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('event_date', [$startDate, $endDate]);
    }

    // ── Accessors & Mutators ───────────────────────────────────────────────

    /**
     * Get formatted event date
     */
    public function getFormattedDateAttribute()
    {
        return $this->event_date ? $this->event_date->format('F d, Y') : null;
    }

    /**
     * Get formatted event time
     */
    public function getFormattedTimeAttribute()
    {
        return $this->event_time ? $this->event_time->format('h:i A') : null;
    }

    /**
     * Check if event is past
     */
    public function getIsPastAttribute()
    {
        return $this->event_date && $this->event_date->isPast();
    }
}