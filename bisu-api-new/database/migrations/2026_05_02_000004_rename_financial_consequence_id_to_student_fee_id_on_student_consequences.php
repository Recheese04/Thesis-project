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
        Schema::table('student_consequences', function (Blueprint $table) {
            // Drop the old foreign key
            $table->dropForeign(['financial_consequence_id']);
            
            // Rename the column
            $table->renameColumn('financial_consequence_id', 'student_fee_id');
            
            // Add the new foreign key
            $table->foreign('student_fee_id')->references('id')->on('student_fees')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_consequences', function (Blueprint $table) {
            $table->dropForeign(['student_fee_id']);
            $table->renameColumn('student_fee_id', 'financial_consequence_id');
            $table->foreign('financial_consequence_id')->references('id')->on('student_fees')->onDelete('set null');
        });
    }
};
