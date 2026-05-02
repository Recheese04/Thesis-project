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
        // Temporarily disable foreign key checks so we can drop tables that are referenced elsewhere.
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('group_chats');
        Schema::dropIfExists('groupchat_messages');
        Schema::dropIfExists('direct_message');
        Schema::dropIfExists('messages');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re‑create the tables as empty shells – you can adjust the columns later if needed.
        Schema::create('group_chats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
        Schema::create('groupchat_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('group_chat_id');
            $table->timestamps();
        });
        Schema::create('direct_message', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
        Schema::create('messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamps();
        });
    }
};
?>
