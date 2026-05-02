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
        // 1. Update consequence_rules
        Schema::table('consequence_rules', function (Blueprint $table) {
            $table->enum('type', ['financial', 'task', 'warning', 'suspension'])->default('task')->after('due_days');
            $table->unsignedBigInteger('fee_type_id')->nullable()->after('type');
            $table->foreign('fee_type_id')->references('id')->on('fee_types')->onDelete('set null');
        });

        // 2. Update student_consequences
        Schema::table('student_consequences', function (Blueprint $table) {
            $table->enum('type', ['financial', 'task', 'warning', 'suspension'])->default('task')->after('event_id');
            $table->unsignedBigInteger('financial_consequence_id')->nullable()->after('type'); // Links to student_fees.id
            $table->foreign('financial_consequence_id')->references('id')->on('student_fees')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_consequences', function (Blueprint $table) {
            $table->dropForeign(['financial_consequence_id']);
            $table->dropColumn(['type', 'financial_consequence_id']);
        });

        Schema::table('consequence_rules', function (Blueprint $table) {
            $table->dropForeign(['fee_type_id']);
            $table->dropColumn(['type', 'fee_type_id']);
        });
    }
};
