<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultHash = Hash::make('password');

        $students = DB::table('users')
            ->whereNotNull('student_number')
            ->get();

        foreach ($students as $student) {
            $shouldUpdate = false;

            if (empty($student->password_hash)) {
                $shouldUpdate = true;
            } elseif (!empty($student->student_number) && Hash::check('bisu_' . $student->student_number, $student->password_hash)) {
                $shouldUpdate = true;
            }

            if ($shouldUpdate) {
                DB::table('users')
                    ->where('id', $student->id)
                    ->update(['password_hash' => $defaultHash]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
