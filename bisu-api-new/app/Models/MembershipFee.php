<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipFee extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'description',
        'amount',
        'status',
        'proof',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
