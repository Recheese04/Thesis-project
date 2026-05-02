<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable FK checks, drop the remaining tables if they exist, then re‑enable.
        DB::statement('SET FOREIGN_KEY_CHECKS = 0;');
        DB::statement('DROP TABLE IF EXISTS `direct_messages`;');
        DB::statement('DROP TABLE IF EXISTS `group_chat_members`;');
        DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse not necessary as these are permanent drops.
    }
};
?>
