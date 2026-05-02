<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable FK checks, drop tables if they exist, then re‑enable.
        DB::statement('SET FOREIGN_KEY_CHECKS = 0;');
        DB::statement('DROP TABLE IF EXISTS `messages`;');
        DB::statement('DROP TABLE IF EXISTS `groupchat_messages`;');
        DB::statement('DROP TABLE IF EXISTS `direct_message`;');
        DB::statement('DROP TABLE IF EXISTS `group_chats`;');
        DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional: recreate empty tables (you can adjust columns later).
        DB::statement('CREATE TABLE `messages` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY) ENGINE=InnoDB;');
        DB::statement('CREATE TABLE `groupchat_messages` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY) ENGINE=InnoDB;');
        DB::statement('CREATE TABLE `direct_message` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY) ENGINE=InnoDB;');
        DB::statement('CREATE TABLE `group_chats` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY) ENGINE=InnoDB;');
    }
};
?>
