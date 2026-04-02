<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_fees', function (Blueprint $table) {
            // Drop old foreign keys first
            $table->dropForeign(['org_id']);
            $table->dropForeign(['users_id']);

            // Rename columns to match conventions
            $table->renameColumn('mebership_fee_id', 'id');
            $table->renameColumn('org_id', 'organization_id');
            $table->renameColumn('users_id', 'user_id');
        });

        Schema::table('membership_fees', function (Blueprint $table) {
            // Re-add foreign keys with corrected column names
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('membership_fees', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['user_id']);

            $table->renameColumn('id', 'mebership_fee_id');
            $table->renameColumn('organization_id', 'org_id');
            $table->renameColumn('user_id', 'users_id');
        });

        Schema::table('membership_fees', function (Blueprint $table) {
            $table->foreign('org_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('users_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
