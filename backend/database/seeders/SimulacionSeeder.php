<?php

namespace Database\Seeders;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use Illuminate\Database\Seeder;

class SimulacionSeeder extends Seeder
{
    public function run(): void
    {
        $crops = [
            'papa' => Crop::where('code', 'papa')->firstOrFail()->id,
            'maiz' => Crop::where('code', 'maiz')->firstOrFail()->id,
            'haba' => Crop::where('code', 'haba')->firstOrFail()->id,
            'zanahoria' => Crop::where('code', 'zanahoria')->firstOrFail()->id,
        ];

        $farmers = [
            ['Sim Félix Huamán', '999111222'],
            ['Sim María Poma', '999333444'],
            ['Sim Juan Quispe', '999555666'],
        ];

        $farmerIds = [];
        foreach ($farmers as [$name, $phone]) {
            $farmerIds[$name] = Farmer::firstOrCreate(['name' => $name], [
                'phone' => $phone,
                'is_active' => true,
            ])->id;
        }

        $plots = [
            [
                'farmer' => 'Sim Félix Huamán', 'name' => 'Sim Parcela Alta', 'lat' => -12.0667, 'lng' => -75.2833,
                'area' => 100, 'crop' => 'papa', 'days_ago' => 70, 'soil' => 'franco',
                'system' => 'goteo', 'eff' => 0.90, 'raw' => 550,
            ],
            [
                'farmer' => 'Sim Félix Huamán', 'name' => 'Sim Parcela Baja', 'lat' => -12.0680, 'lng' => -75.2845,
                'area' => 200, 'crop' => 'maiz', 'days_ago' => 50, 'soil' => 'franco_arenoso',
                'system' => 'gravedad', 'eff' => 0.60, 'raw' => 700,
            ],
            [
                'farmer' => 'Sim María Poma', 'name' => 'Sim Huerto Haba', 'lat' => -12.0650, 'lng' => -75.2820,
                'area' => 150, 'crop' => 'haba', 'days_ago' => 40, 'soil' => 'franco_arcilloso',
                'system' => 'aspersion', 'eff' => 0.75, 'raw' => 450,
            ],
            [
                'farmer' => 'Sim Juan Quispe', 'name' => 'Sim Zanahoria Norte', 'lat' => -12.0700, 'lng' => -75.2860,
                'area' => 120, 'crop' => 'zanahoria', 'days_ago' => 30, 'soil' => 'franco',
                'system' => 'goteo', 'eff' => 0.90, 'raw' => 650,
            ],
        ];

        foreach ($plots as $p) {
            $plot = Plot::firstOrCreate(['name' => $p['name']], [
                'farmer_id' => $farmerIds[$p['farmer']],
                'latitude' => $p['lat'],
                'longitude' => $p['lng'],
                'boundary' => null,
                'area_m2' => $p['area'],
                'area_origin' => 'manual',
                'crop_id' => $crops[$p['crop']],
                'sowing_date' => now()->subDays($p['days_ago'])->toDateString(),
                'soil_texture_code' => $p['soil'],
                'irrigation_system' => $p['system'],
                'irrigation_efficiency' => $p['eff'],
                'flow_lpm' => 20,
                'status' => 'activa',
            ]);

            $sensor = Sensor::query()->where('plot_id', $plot->id)->where('type', 'humedad')->first();
            if ($sensor === null) {
                $sensor = Sensor::create([
                    'plot_id' => $plot->id,
                    'type' => 'humedad',
                    'model' => 'YL-69',
                    'pin' => 'A0',
                    'dry_ref' => 1020,
                    'wet_ref' => 320,
                    'status' => 'ok',
                    'is_active' => true,
                ]);
            }

            $pct = round((1020 - $p['raw']) / (1020 - 320) * 100, 2);
            Measurement::firstOrCreate(
                ['sensor_id' => $sensor->id, 'measured_at' => now()->subMinutes(10)->format('Y-m-d H:00:00')],
                [
                    'plot_id' => $plot->id,
                    'raw_value' => $p['raw'],
                    'norm_value' => $pct,
                    'quality' => 'ok',
                    'origin' => 'demo',
                ]
            );

            $exists = Forecast::query()->where('plot_id', $plot->id)
                ->where('fetched_at', '>=', now()->subMinutes(30))
                ->exists();
            if (! $exists) {
                Forecast::create([
                    'plot_id' => $plot->id,
                    'fetched_at' => now(),
                    'issued_at' => now(),
                    'period_from' => now(),
                    'period_to' => now()->copy()->addHours(6),
                    'temp_max' => 24,
                    'temp_min' => 12,
                    'rain_mm' => 0,
                    'rain_prob' => 0.2,
                    'raw_json' => ['demo' => true, 'simulacion' => true],
                    'origin' => 'demo',
                ]);
            }
        }

        $this->command->info('Simulación lista: 3 agricultores, 4 parcelas, sensores + lecturas + clima demo.');
    }
}
