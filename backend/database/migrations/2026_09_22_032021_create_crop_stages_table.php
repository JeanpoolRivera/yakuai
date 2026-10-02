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
        Schema::create('crop_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained()->cascadeOnDelete();
            $table->string('stage', 20);
            $table->unsignedInteger('days');
            $table->decimal('kc', 4, 2);
            $table->decimal('root_depth_m', 5, 2);
            $table->decimal('depletion_fraction', 4, 2);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['crop_id', 'stage', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crop_stages');
    }
};
