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
        Schema::create('consequence_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // pending, completed, etc.
            $table->string('label');         // Pending, Completed, etc.
            $table->string('color');         // Hex color
            $table->string('description')->nullable();
            $table->enum('type', ['financial', 'non_financial', 'both'])->default('both');
            $table->timestamps();
        });

        // Seed initial statuses
        DB::table('consequence_statuses')->insert([
            [
                'name' => 'pending',
                'label' => 'Pending',
                'color' => '#FFA500',
                'description' => 'Awaiting action or payment',
                'type' => 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'completed',
                'label' => 'Completed',
                'color' => '#00C851',
                'description' => 'Task done or fine paid',
                'type' => 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'cancelled',
                'label' => 'Cancelled',
                'color' => '#FF4444',
                'description' => 'Rule was removed or event voided',
                'type' => 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'active',
                'label' => 'Active',
                'color' => '#33B5E5',
                'description' => 'Currently in progress',
                'type' => 'non_financial',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'overdue',
                'label' => 'Overdue',
                'color' => '#FF6D00',
                'description' => 'Past the due date',
                'type' => 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'waived',
                'label' => 'Waived',
                'color' => '#9E9E9E',
                'description' => 'Excused by an officer',
                'type' => 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consequence_statuses');
    }
};
