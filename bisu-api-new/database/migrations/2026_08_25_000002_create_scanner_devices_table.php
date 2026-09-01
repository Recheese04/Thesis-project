<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scanner_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique(); // MAC address e.g. "84:F3:EB:A1:B2:C3"
            $table->string('name')->default('Unnamed Scanner');
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('set null');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index('device_id');
            $table->index(['organization_id', 'last_seen_at']);
        });

        // Add device_id column to scanner_sessions table
        Schema::table('scanner_sessions', function (Blueprint $table) {
            $table->string('device_id')->nullable()->after('organization_id');
        });
    }

    public function down(): void
    {
        Schema::table('scanner_sessions', function (Blueprint $table) {
            $table->dropColumn('device_id');
        });
        Schema::dropIfExists('scanner_devices');
    }
};
