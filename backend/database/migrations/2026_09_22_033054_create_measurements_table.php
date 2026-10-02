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
        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensor_id')->constrained()->restrictOnDelete();
            $table->foreignId('plot_id')->constrained()->restrictOnDelete();
            $table->dateTime('measured_at');
            $table->decimal('raw_value', 10, 2);
            $table->decimal('norm_value', 8, 2)->nullable();
            $table->string('quality', 20)->default('ok');
            $table->string('origin', 20)->default('manual');
            $table->timestamps();
            $table->unique(['sensor_id', 'measured_at']);
            $table->index(['plot_id', 'measured_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
