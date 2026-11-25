<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sensors')->where('type', 'temperatura_agua')->update(['type' => 'temperatura_suelo']);
    }

    public function down(): void
    {
        DB::table('sensors')->where('type', 'temperatura_suelo')->update(['type' => 'temperatura_agua']);
    }
};
