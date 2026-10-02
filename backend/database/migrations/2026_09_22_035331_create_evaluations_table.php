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
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_id')->constrained()->restrictOnDelete();
            $table->dateTime('evaluated_at');
            $table->string('stage', 20)->nullable();
            $table->json('inputs_snapshot');
            $table->string('result', 20);
            $table->decimal('min_liters', 10, 2)->nullable();
            $table->decimal('max_liters', 10, 2)->nullable();
            $table->string('confidence', 20)->nullable();
            $table->string('reason', 80);
            $table->dateTime('next_at')->nullable();
            $table->boolean('is_critical')->default(false);
            $table->timestamps();
            $table->unique(['plot_id', 'evaluated_at']);
            $table->index(['plot_id', 'evaluated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
