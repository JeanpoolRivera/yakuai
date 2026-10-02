<?php

namespace App\Console\Commands;

use App\Models\Forecast;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('yakuai:pronosticos:limpiar')]
#[Description('Borra pronósticos con más de 30 días para evitar acumulación infinita')]
class PronosticosLimpiar extends Command
{
    public function handle(): int
    {
        try {
            $count = Forecast::query()
                ->where('fetched_at', '<', now()->subDays(30))
                ->delete();
        } catch (\Throwable $e) {
            $this->warn('Sin base lista para limpiar: '.$e->getMessage());

            return self::SUCCESS;
        }

        $this->info("Pronósticos borrados: {$count}.");

        return self::SUCCESS;
    }
}
