<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Evaluation;
use App\Models\Farmer;
use App\Models\Irrigation;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FarmerScopingTest extends TestCase
{
    use RefreshDatabase;

    private function plot(int $farmerId, string $name): Plot
    {
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        return Plot::create([
            'farmer_id' => $farmerId,
            'name' => $name,
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);
    }

    private function seedPair(): array
    {
        $this->seed(CatalogSeeder::class);
        $a = Farmer::create(['name' => 'A']);
        $b = Farmer::create(['name' => 'B']);

        foreach ([$a->id => 'PA', $b->id => 'PB'] as $farmerId => $name) {
            $plot = $this->plot($farmerId, $name);
            $sensor = Sensor::create([
                'plot_id' => $plot->id, 'type' => 'humedad', 'model' => 'YL-69',
                'dry_ref' => 1020, 'wet_ref' => 320,
            ]);
            Measurement::create([
                'sensor_id' => $sensor->id, 'plot_id' => $plot->id,
                'measured_at' => now()->toDateTimeString(),
                'raw_value' => 650, 'norm_value' => 52.86, 'quality' => 'ok',
            ]);
            Evaluation::create([
                'plot_id' => $plot->id, 'evaluated_at' => now()->startOfHour()->toDateTimeString(),
                'inputs_snapshot' => [], 'result' => 'no', 'reason' => 'humedad_suficiente',
            ]);
            Irrigation::create([
                'plot_id' => $plot->id, 'occurred_at' => now()->toDateTimeString(),
                'applied_liters' => 1000,
            ]);
        }

        return [$a, $b];
    }

    public function test_agricultor_solo_ve_datos_de_sus_parcelas(): void
    {
        [$a] = $this->seedPair();
        $plotA = Plot::where('farmer_id', $a->id)->firstOrFail();

        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor', 'farmer_id' => $a->id]));

        foreach (['/api/v1/sensors', '/api/v1/measurements', '/api/v1/evaluations', '/api/v1/irrigations'] as $path) {
            $ids = collect($this->getJson($path)->assertOk()->json('data'))
                ->pluck('plot_id')->unique()->values()->all();
            $this->assertSame([$plotA->id], $ids, "Alcance incorrecto en {$path}");
        }
    }

    public function test_agricultor_sin_vincular_no_ve_datos(): void
    {
        $this->seedPair();

        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor']));

        foreach (['/api/v1/sensors', '/api/v1/measurements', '/api/v1/evaluations', '/api/v1/irrigations'] as $path) {
            $this->getJson($path)->assertOk()->assertJsonCount(0, 'data');
        }
    }
}
