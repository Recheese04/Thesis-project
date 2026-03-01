<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClearanceRequirement extends Model
{
    protected $table = 'clearance_requirements';

    protected $fillable = [
        'organization_id',
        'name',
        'type',
        'description',
        'amount',
        'school_year',
        'semester',
        'is_active',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function studentClearances()
    {
        return $this->hasMany(StudentClearance::class , 'requirement_id');
    }
}