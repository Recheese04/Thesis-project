<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('groupchat_messages');
        Schema::dropIfExists('direct_message');
        Schema::dropIfExists('group_chats');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re‑create the tables if you need to rollback.
        Schema::create('messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            // Add columns that were previously present (placeholder)
            $table->timestamps();
        });
        Schema::create('groupchat_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
        Schema::create('direct_message', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
        Schema::create('group_chats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
    }
};
?>
