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
        Schema::create('irrigations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_id')->constrained()->restrictOnDelete();
            $table->foreignId('evaluation_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('irrigations')->restrictOnDelete();
            $table->dateTime('occurred_at');
            $table->decimal('recommended_liters', 10, 2)->nullable();
            $table->decimal('applied_liters', 10, 2);
            $table->string('origin', 20)->default('manual');
            $table->string('note', 255)->nullable();
            $table->string('status', 20)->default('activo');
            $table->timestamps();
            $table->index(['plot_id', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('irrigations');
    }
};
