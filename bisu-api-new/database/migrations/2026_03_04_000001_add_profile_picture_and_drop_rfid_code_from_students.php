<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        // Add profile picture column (guard for idempotency)
        if (!Schema::hasColumn('students', 'profile_picture')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('profile_picture')->nullable();
            });
        }

        // Drop rfid_code if it exists (rfid_uid is the correct/working column)
        if (Schema::hasColumn('students', 'rfid_code')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('rfid_code');
            });
        }
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('profile_picture');
        });
    }
};
