<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_organizations', function (Blueprint $table) {
            $table->unsignedBigInteger('school_year_id')->nullable()->after('organization_id');
        });

        // Backfill: assign existing members to the active school year
        $activeYear = DB::table('school_years')->where('is_active', true)->first();
        if ($activeYear) {
            DB::table('member_organizations')
                ->whereNull('school_year_id')
                ->update(['school_year_id' => $activeYear->id]);
        }
    }

    public function down(): void
    {
        Schema::table('member_organizations', function (Blueprint $table) {
            $table->dropColumn('school_year_id');
        });
    }
};
