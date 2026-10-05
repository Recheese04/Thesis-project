<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function feeTypes()
    {
        return $this->hasMany(FeeType::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function designations()
    {
        return $this->hasMany(Designation::class);
    }

    public function consequenceRules()
    {
        return $this->hasMany(ConsequenceRule::class);
    }
}
