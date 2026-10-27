<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crop_stages', function (Blueprint $table): void {
            $table->string('source', 255)->default('');
            $table->text('source_url')->nullable();
            $table->date('reviewed_at')->nullable();
        });

        Schema::table('soil_textures', function (Blueprint $table): void {
            $table->text('source_url')->nullable();
            $table->date('reviewed_at')->nullable();
        });

        DB::table('crop_stages')->update([
            'source' => 'FAO-56, Tables 12 and 22; stage durations are provisional. Local validation pending.',
            'source_url' => 'https://www.fao.org/4/X0490E/x0490e0b.htm',
            'reviewed_at' => now()->toDateString(),
        ]);

        DB::table('soil_textures')->update([
            'source_url' => 'https://www.fao.org/4/X0490E/x0490e0e.htm',
            'reviewed_at' => now()->toDateString(),
        ]);
    }

    public function down(): void
    {
        Schema::table('crop_stages', function (Blueprint $table): void {
            $table->dropColumn(['source', 'source_url', 'reviewed_at']);
        });

        Schema::table('soil_textures', function (Blueprint $table): void {
            $table->dropColumn(['source_url', 'reviewed_at']);
        });
    }
};
