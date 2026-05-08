<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Seed the payment_methods table with GCash and PayMaya.
     */
    public function run(): void
    {
        $methods = ['gcash', 'paymaya'];

        foreach ($methods as $method) {
            DB::table('payment_methods')->updateOrInsert(
                ['name' => $method],
                ['name' => $method, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
