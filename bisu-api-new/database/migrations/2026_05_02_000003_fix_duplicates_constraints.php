<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix #3: Add Unique Constraints to prevent duplicates
        
        // 1. Attendance: One user per event
        Schema::table('attendances', function (Blueprint $table) {
            // Note: If you have existing duplicates, this might fail. 
            // You should clean your data first.
            $table->unique(['event_id', 'user_id'], 'unique_attendance');
        });

        // 2. Evaluation Responses: One response per evaluation per user
        Schema::table('evaluation_responses', function (Blueprint $table) {
            $table->unique(['evaluation_id', 'user_id'], 'unique_evaluation_response');
        });

        // 3. Designations: One user per organization
        Schema::table('designations', function (Blueprint $table) {
            $table->unique(['user_id', 'organization_id'], 'unique_designation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('designations', function (Blueprint $table) {
            $table->dropUnique('unique_designation');
        });

        Schema::table('evaluation_responses', function (Blueprint $table) {
            $table->dropUnique('unique_evaluation_response');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('unique_attendance');
        });
    }
};
