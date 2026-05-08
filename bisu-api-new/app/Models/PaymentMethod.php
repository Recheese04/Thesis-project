<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'account_number', 'account_name'];

    /**
     * A payment method can be used in many student fees.
     */
    public function studentFees()
    {
        return $this->hasMany(StudentFee::class);
    }
}
