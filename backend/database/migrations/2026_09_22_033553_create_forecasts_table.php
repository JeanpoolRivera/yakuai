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
        Schema::create('forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_id')->constrained()->restrictOnDelete();
            $table->dateTime('fetched_at');
            $table->dateTime('issued_at')->nullable();
            $table->dateTime('period_from');
            $table->dateTime('period_to');
            $table->decimal('temp_max', 5, 2)->nullable();
            $table->decimal('temp_min', 5, 2)->nullable();
            $table->decimal('rain_mm', 8, 2)->default(0);
            $table->decimal('rain_prob', 4, 2)->default(0);
            $table->json('raw_json')->nullable();
            $table->string('origin', 20)->default('owm');
            $table->timestamps();
            $table->index(['plot_id', 'fetched_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('forecasts');
    }
};
