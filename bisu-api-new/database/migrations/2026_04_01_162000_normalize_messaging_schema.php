<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create normalized direct_messages table
        Schema::dropIfExists('direct_messages'); // in case partial run left it
        Schema::create('direct_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_id');
            $table->unsignedBigInteger('receiver_id');
            $table->text('message')->nullable();
            $table->string('image_path', 500)->nullable();
            $table->boolean('is_edited')->default(false);
            $table->timestamps();

            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['sender_id', 'receiver_id']);
        });

        // 2. Migrate existing PM rows from messages → direct_messages
        DB::statement("
            INSERT INTO direct_messages (sender_id, receiver_id, message, image_path, is_edited, created_at, updated_at)
            SELECT sender_id, receiver_id, message, image_path, is_edited, created_at, updated_at
            FROM messages
            WHERE receiver_id IS NOT NULL
        ");

        // 3. Delete migrated PM rows from messages
        DB::statement("DELETE FROM messages WHERE receiver_id IS NOT NULL");

        // 4. Drop FKs using their actual MySQL names
        DB::statement("ALTER TABLE messages DROP FOREIGN KEY messages_ibfk_1"); // organization_id
        DB::statement("ALTER TABLE messages DROP FOREIGN KEY messages_receiver_fk"); // receiver_id

        // 5. Drop the redundant columns
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['organization_id', 'receiver_id']);
        });

        // 6. Delete any orphan messages with no group_chat_id
        DB::statement("DELETE FROM messages WHERE group_chat_id IS NULL");

        // 7. Make group_chat_id NOT NULL
        DB::statement("ALTER TABLE messages MODIFY group_chat_id BIGINT UNSIGNED NOT NULL");
    }

    public function down(): void
    {
        // Make group_chat_id nullable again
        DB::statement("ALTER TABLE messages MODIFY group_chat_id BIGINT UNSIGNED NULL");

        // Re-add columns to messages
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('organization_id')->nullable()->after('id');
            $table->unsignedBigInteger('receiver_id')->nullable()->after('sender_id');
        });

        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_ibfk_1 FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE");
        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_receiver_fk FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE");

        // Move DMs back
        DB::statement("
            INSERT INTO messages (sender_id, receiver_id, message, image_path, is_edited, created_at, updated_at)
            SELECT sender_id, receiver_id, message, image_path, is_edited, created_at, updated_at
            FROM direct_messages
        ");

        Schema::dropIfExists('direct_messages');
    }
};
