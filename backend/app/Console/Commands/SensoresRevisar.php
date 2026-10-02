<?php

namespace App\Console\Commands;

use App\Models\Sensor;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('yakuai:sensores:revisar')]
#[Description('Marca sin_datos los sensores activos sin lectura ok en 3 horas')]
class SensoresRevisar extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $limit = now()->subHours(3);

        $count = Sensor::query()
            ->where('is_active', true)
            ->where('status', 'ok')
            ->whereNotExists(function ($query) use ($limit): void {
                $query->selectRaw('1')
                    ->from('measurements')
                    ->whereColumn('measurements.sensor_id', 'sensors.id')
                    ->where('measurements.quality', 'ok')
                    ->where('measurements.measured_at', '>=', $limit);
            })
            ->update(['status' => 'sin_datos']);

        $this->info("Sensores marcados sin_datos: {$count}.");

        return self::SUCCESS;
    }
}
