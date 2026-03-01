<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        if (!Schema::hasColumn('clearance_requirements', 'amount')) {
            Schema::table('clearance_requirements', function (Blueprint $table) {
                $table->decimal('amount', 10, 2)->nullable()->after('description');
            });
        }
    }

    public function down(): void
    {
        Schema::table('clearance_requirements', function (Blueprint $table) {
            $table->dropColumn('amount');
        });
    }
};
