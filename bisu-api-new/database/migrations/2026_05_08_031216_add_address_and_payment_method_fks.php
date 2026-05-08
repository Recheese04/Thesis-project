<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * - Adds address_id (FK → address) and is_deleted to users
     * - Adds payment_method_id (FK → payment_methods) and is_deleted to student_fees
     */
    public function up(): void
    {
        // ── 1. users: add address_id FK and is_deleted ──────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('address_id')
                  ->nullable()
                  ->after('profile_picture')
                  ->constrained('address')
                  ->nullOnDelete();
            $table->boolean('is_deleted')->default(false)->after('address_id');
        });

        // ── 2. student_fees: add payment_method_id FK and is_deleted ────────
        Schema::table('student_fees', function (Blueprint $table) {
            $table->foreignId('payment_method_id')
                  ->nullable()
                  ->after('proof')
                  ->constrained('payment_methods')
                  ->nullOnDelete();
            $table->boolean('is_deleted')->default(false)->after('payment_method_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_fees', function (Blueprint $table) {
            $table->dropForeign(['payment_method_id']);
            $table->dropColumn(['payment_method_id', 'is_deleted']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['address_id']);
            $table->dropColumn(['address_id', 'is_deleted']);
        });
    }
};
