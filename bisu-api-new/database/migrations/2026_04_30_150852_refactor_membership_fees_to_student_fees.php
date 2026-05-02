<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename table
        Schema::rename('membership_fees', 'student_fees');

        // 2. Add new foreign key and drop redundant columns
        Schema::table('student_fees', function (Blueprint $table) {
            $table->unsignedBigInteger('fee_type_id')->nullable()->after('organization_id');
            $table->foreign('fee_type_id')->references('id')->on('fee_types')->onDelete('cascade');
            
            // Note: We keep organization_id to make filtering by org faster/easier
            // Drop redundant data columns (since they are now in fee_types)
            $table->dropColumn(['name', 'description', 'amount']);
        });
    }

    public function down(): void
    {
        Schema::table('student_fees', function (Blueprint $table) {
            // Re-add columns
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->decimal('amount', 8, 2)->default(0);
            
            // Drop foreign key
            $table->dropForeign(['fee_type_id']);
            $table->dropColumn('fee_type_id');
        });

        // Rename back
        Schema::rename('student_fees', 'membership_fees');
    }
};
