<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'account_number', 'account_name', 'instructions', 'qr_code', 'is_active'];

    /**
     * A payment method can be used in many student fees.
     */
    public function studentFees()
    {
        return $this->hasMany(StudentFee::class);
    }
}
