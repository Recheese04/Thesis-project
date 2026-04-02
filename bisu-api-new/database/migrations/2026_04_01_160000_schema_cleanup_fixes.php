<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop redundant school_year_id from attendances (derivable via events)
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'school_year_id')) {
                $table->dropForeign(['school_year_id']);
            }
        });
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'school_year_id')) {
                $table->dropColumn('school_year_id');
            }
        });

        // 2. Add missing FK on attendances.user_id
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Add missing FK on designations.user_id
        Schema::table('designations', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 4. Add missing FK on designations.school_year_id (nullable)
        Schema::table('designations', function (Blueprint $table) {
            $table->foreign('school_year_id')->references('id')->on('school_years')->onDelete('set null');
        });

        // 5. Drop dead remember_token from users
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });

        // 6. Drop ghost event_category from consequence_rules
        Schema::table('consequence_rules', function (Blueprint $table) {
            if (Schema::hasColumn('consequence_rules', 'event_category')) {
                $table->dropColumn('event_category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('school_year_id')->nullable();
            $table->foreign('school_year_id')->references('id')->on('school_years');
            $table->dropForeign(['user_id']);
        });

        Schema::table('designations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['school_year_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('remember_token', 100)->nullable();
        });

        Schema::table('consequence_rules', function (Blueprint $table) {
            $table->string('event_category', 100)->nullable();
        });
    }
};
