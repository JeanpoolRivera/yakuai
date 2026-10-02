<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClosingTest extends TestCase
{
    use RefreshDatabase;

    private Plot $plot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogSeeder::class);
        $farmer = Farmer::create(['name' => 'Test']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;
        $this->plot = Plot::create([
            'farmer_id' => $farmer->id,
            'name' => 'P1',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(70)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']), ['*']);
    }

    public function test_mensaje_riego_listo_para_whatsapp(): void
    {
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id, 'type' => 'humedad', 'model' => 'YL-69',
            'dry_ref' => 1020, 'wet_ref' => 320,
        ]);
        Measurement::create([
            'sensor_id' => $sensor->id,
            'plot_id' => $this->plot->id,
            'measured_at' => now()->subMinutes(5),
            'raw_value' => 660,
            'norm_value' => 20,
            'quality' => 'ok',
            'origin' => 'demo',
        ]);
        Forecast::create([
            'plot_id' => $this->plot->id,
            'fetched_at' => now()->subMinutes(5),
            'issued_at' => now(),
            'period_from' => now(),
            'period_to' => now()->addHours(6),
            'temp_max' => 25,
            'temp_min' => 12,
            'rain_mm' => 0,
            'rain_prob' => 0,
            'origin' => 'demo',
        ]);

        $id = $this->postJson("/api/v1/plots/{$this->plot->id}/evaluate")
            ->assertCreated()->json('data.id');

        $texto = $this->getJson("/api/v1/evaluations/{$id}/mensaje")
            ->assertOk()->json('data.texto');

        $this->assertStringContainsString('YakuAI', $texto);
        $this->assertStringContainsString('4650', $texto);
        $this->assertStringContainsString('05:30', $texto);
    }

    public function test_caudalimetro_acepta_rango(): void
    {
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id, 'type' => 'caudal', 'model' => 'YF-S201',
        ]);

        $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 20,
        ])->assertCreated()->assertJsonPath('data.quality', 'ok');

        $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->subMinute()->toDateTimeString(),
            'raw_value' => 99,
        ])->assertCreated()->assertJsonPath('data.quality', 'anomalo');
    }
}
