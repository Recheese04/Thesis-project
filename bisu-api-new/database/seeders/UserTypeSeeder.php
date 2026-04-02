<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserType;

class UserTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Admin', 'Officer', 'Student'] as $name) {
            UserType::firstOrCreate(['name' => $name]);
        }
    }
}