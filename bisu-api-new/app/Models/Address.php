<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;
    protected $table = 'address';

    protected $fillable = [
        'street',
        'barangay',
        'city',
        'province',
        'zip_code',
    ];

    /**
     * A single address can belong to many users.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
