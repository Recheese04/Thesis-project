<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'event_id',
        'user_id',
        'attendance_type',
        'time_in',
        'time_out',
        'status',
        'remarks',
    ];

    protected $casts = [
        'time_in'  => 'datetime',
        'time_out' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    /**
     * User relationship.
     * attendances.user_id → users.id
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    /** Duration in whole minutes between time_in and time_out. */
    public function getDurationMinutesAttribute(): ?int
    {
        if (!$this->time_in || !$this->time_out) return null;
        return (int) $this->time_in->diffInMinutes($this->time_out);
    }

    /** Human-readable duration e.g. "4h 30m". Returns "—" until checked out. */
    public function getFormattedDurationAttribute(): string
    {
        $minutes = $this->duration_minutes;
        if ($minutes === null) return '—';

        $hours = (int) floor($minutes / 60);
        $mins  = $minutes % 60;

        if ($hours > 0 && $mins > 0) return "{$hours}h {$mins}m";
        if ($hours > 0)              return "{$hours}h";
        return "{$mins}m";
    }

    /** True when checked in but not yet checked out. */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'checked_in'
            && $this->time_in !== null
            && $this->time_out === null;
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeCheckedIn($q)  { return $q->where('status', 'checked_in'); }
    public function scopeCheckedOut($q) { return $q->where('status', 'checked_out'); }
    public function scopeForEvent($q, int $eventId) { return $q->where('event_id', $eventId); }
    public function scopeByType($q, string $type)   { return $q->where('attendance_type', $type); }
}