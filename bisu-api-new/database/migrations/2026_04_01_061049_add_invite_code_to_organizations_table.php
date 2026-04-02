<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('invite_code', 10)->nullable()->unique()->after('status');
        });

        // Generate codes for existing organizations
        $organizations = DB::table('organizations')->get();
        foreach ($organizations as $org) {
            do {
                $code = strtoupper(Str::random(6));
            } while (DB::table('organizations')->where('invite_code', $code)->exists());

            DB::table('organizations')->where('id', $org->id)->update(['invite_code' => $code]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('invite_code');
        });
    }
};
