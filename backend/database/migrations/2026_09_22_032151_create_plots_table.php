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
        Schema::create('plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')->constrained()->restrictOnDelete();
            $table->string('name', 120);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->json('boundary')->nullable();
            $table->decimal('area_m2', 10, 2);
            $table->string('area_origin', 20)->default('dibujo');
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->date('sowing_date');
            $table->string('soil_texture_code', 30);
            $table->foreign('soil_texture_code')->references('code')->on('soil_textures')->restrictOnDelete();
            $table->string('irrigation_system', 30);
            $table->decimal('irrigation_efficiency', 4, 2);
            $table->decimal('flow_lpm', 8, 2)->nullable();
            $table->string('status', 20)->default('activa');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
