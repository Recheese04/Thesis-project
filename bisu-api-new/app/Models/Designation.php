<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SchoolYear;

class Designation extends Model
{
    use HasFactory;

    protected $table = 'designations';

    protected $fillable = [
        'organization_id',
        'user_id',
        'school_year_id',
        'designation',
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function schoolYear()
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOfficers($query)
    {
        return $query->whereNotIn('designation', ['Member']);
    }

    public function scopeMembers($query)
    {
        return $query->where('designation', 'Member');
    }
}
