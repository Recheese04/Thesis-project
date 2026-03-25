<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('school_year_id')->nullable()->constrained('school_years')->onDelete('cascade');
        });

        Schema::table('student_clearances', function (Blueprint $table) {
            $table->foreignId('school_year_id')->nullable()->constrained('school_years')->onDelete('cascade');
            // $table->dropColumn('school_year'); // Optional: drop later if needed
        });

        Schema::table('clearance_requirements', function (Blueprint $table) {
            $table->foreignId('school_year_id')->nullable()->constrained('school_years')->onDelete('cascade');
            // $table->dropColumn('school_year'); // Optional: drop later if needed
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['school_year_id']);
            $table->dropColumn('school_year_id');
        });

        Schema::table('student_clearances', function (Blueprint $table) {
            $table->dropForeign(['school_year_id']);
            $table->dropColumn('school_year_id');
        });

        Schema::table('clearance_requirements', function (Blueprint $table) {
            $table->dropForeign(['school_year_id']);
            $table->dropColumn('school_year_id');
        });
    }
};
