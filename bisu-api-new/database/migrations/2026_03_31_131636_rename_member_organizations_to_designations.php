<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename the table
        Schema::rename('member_organizations', 'designations');

        // 2. Merge role + position into a single 'designation' column
        //    First, add the new column
        Schema::table('designations', function (Blueprint $table) {
            $table->string('designation', 100)->nullable()->after('user_id');
        });

        // 3. Populate 'designation' from existing role/position data
        //    If position exists, use it (e.g. "President"). Otherwise capitalize the role (e.g. "Member")
        DB::statement("
            UPDATE designations
            SET designation = CASE
                WHEN position IS NOT NULL AND position != '' THEN position
                WHEN role = 'officer' THEN 'Officer'
                WHEN role = 'adviser' THEN 'Adviser'
                ELSE 'Member'
            END
        ");

        // 4. Drop the old columns
        Schema::table('designations', function (Blueprint $table) {
            $table->dropColumn(['role', 'position']);
        });
    }

    public function down(): void
    {
        // Reverse: add role + position back
        Schema::table('designations', function (Blueprint $table) {
            $table->string('role', 50)->default('member')->after('user_id');
            $table->string('position', 100)->nullable()->after('role');
        });

        // Populate from designation
        DB::statement("
            UPDATE designations
            SET role = CASE
                WHEN designation = 'Member' THEN 'member'
                WHEN designation = 'Adviser' THEN 'adviser'
                ELSE 'officer'
            END,
            position = CASE
                WHEN designation NOT IN ('Member', 'Officer', 'Adviser') THEN designation
                ELSE NULL
            END
        ");

        Schema::table('designations', function (Blueprint $table) {
            $table->dropColumn('designation');
        });

        Schema::rename('designations', 'member_organizations');
    }
};
