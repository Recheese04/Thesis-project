<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('membership_fees', function (Blueprint $table) {
            $table->id('mebership_fee_id'); // Using exactly what was in the screenshot or we can just use id()
            $table->unsignedBigInteger('org_id')->nullable();
            $table->unsignedBigInteger('users_id')->nullable();
            $table->decimal('amount', 8, 2)->default(0);
            $table->string('status')->default('pending'); // pending, paid
            $table->string('proof')->nullable();
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('users_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_fees');
    }
};
