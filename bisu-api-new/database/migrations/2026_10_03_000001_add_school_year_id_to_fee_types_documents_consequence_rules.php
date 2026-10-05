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
        // 1. Add school_year_id to fee_types
        if (Schema::hasTable('fee_types') && !Schema::hasColumn('fee_types', 'school_year_id')) {
            Schema::table('fee_types', function (Blueprint $table) {
                $table->foreignId('school_year_id')->nullable()->after('organization_id')->constrained('school_years')->onDelete('cascade');
            });
        }

        // 2. Add school_year_id to documents
        if (Schema::hasTable('documents') && !Schema::hasColumn('documents', 'school_year_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->foreignId('school_year_id')->nullable()->after('organization_id')->constrained('school_years')->onDelete('cascade');
            });
        }

        // 3. Add school_year_id to consequence_rules
        if (Schema::hasTable('consequence_rules') && !Schema::hasColumn('consequence_rules', 'school_year_id')) {
            Schema::table('consequence_rules', function (Blueprint $table) {
                $table->foreignId('school_year_id')->nullable()->after('organization_id')->constrained('school_years')->onDelete('set null');
            });
        }

        // 4. Backfill existing records with the active school year
        $activeYear = DB::table('school_years')->where('is_active', true)->first()
            ?? DB::table('school_years')->orderBy('id', 'desc')->first();

        if ($activeYear) {
            if (Schema::hasColumn('fee_types', 'school_year_id')) {
                DB::table('fee_types')->whereNull('school_year_id')->update(['school_year_id' => $activeYear->id]);
            }
            if (Schema::hasColumn('documents', 'school_year_id')) {
                DB::table('documents')->whereNull('school_year_id')->update(['school_year_id' => $activeYear->id]);
            }
            if (Schema::hasColumn('consequence_rules', 'school_year_id')) {
                // First inherit from linked event if present
                DB::statement("UPDATE consequence_rules cr 
                    INNER JOIN events e ON cr.event_id = e.id 
                    SET cr.school_year_id = e.school_year_id 
                    WHERE cr.school_year_id IS NULL AND e.school_year_id IS NOT NULL");
                // Otherwise fall back to the active school year
                DB::table('consequence_rules')->whereNull('school_year_id')->update(['school_year_id' => $activeYear->id]);
            }
            // Also ensure designations have backfill if any null
            if (Schema::hasColumn('designations', 'school_year_id')) {
                DB::table('designations')->whereNull('school_year_id')->update(['school_year_id' => $activeYear->id]);
            }
            // And events if any null
            if (Schema::hasColumn('events', 'school_year_id')) {
                DB::table('events')->whereNull('school_year_id')->update(['school_year_id' => $activeYear->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('consequence_rules') && Schema::hasColumn('consequence_rules', 'school_year_id')) {
            Schema::table('consequence_rules', function (Blueprint $table) {
                $table->dropForeign(['school_year_id']);
                $table->dropColumn('school_year_id');
            });
        }

        if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'school_year_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropForeign(['school_year_id']);
                $table->dropColumn('school_year_id');
            });
        }

        if (Schema::hasTable('fee_types') && Schema::hasColumn('fee_types', 'school_year_id')) {
            Schema::table('fee_types', function (Blueprint $table) {
                $table->dropForeign(['school_year_id']);
                $table->dropColumn('school_year_id');
            });
        }
    }
};
