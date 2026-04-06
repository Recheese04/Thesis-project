<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_consequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('consequence_rule_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('event_id')->nullable();
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('consequence_rule_id')->references('id')->on('consequence_rules')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('set null');

            // Prevent duplicate assignments
            $table->unique(['consequence_rule_id', 'user_id', 'event_id'], 'unique_consequence_assignment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_consequences');
    }
};
