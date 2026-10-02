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
        Schema::create('sensors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_id')->constrained()->restrictOnDelete();
            $table->string('type', 20);
            $table->string('model', 60)->default('YL-69');
            $table->string('pin', 10)->nullable();
            $table->integer('dry_ref')->nullable();
            $table->integer('wet_ref')->nullable();
            $table->string('status', 20)->default('ok');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};
