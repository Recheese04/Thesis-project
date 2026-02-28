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

    public function evaluation()
    {
        return $this->hasOne(EventEvaluation::class, 'event_id');
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

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getFormattedDateAttribute(): ?string
    {
        return $this->event_date ? $this->event_date->format('F d, Y') : null;
    }

    public function getFormattedTimeAttribute(): ?string
    {
        if (!$this->event_time) return null;
        try {
            return \Carbon\Carbon::createFromFormat('H:i:s', $this->event_time)->format('h:i A');
        } catch (\Exception $e) {
            return $this->event_time;
        }
    }

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