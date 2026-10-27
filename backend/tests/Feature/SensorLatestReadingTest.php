<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SensorLatestReadingTest extends TestCase
{
    use RefreshDatabase;

    private function sensor(): Sensor
    {
        $this->seed(CatalogSeeder::class);
        $farmer = Farmer::create(['name' => 'Test']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        $plot = Plot::create([
            'farmer_id' => $farmer->id,
            'name' => 'P1',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);

        return Sensor::create([
            'plot_id' => $plot->id, 'type' => 'humedad', 'model' => 'YL-69',
            'dry_ref' => 1020, 'wet_ref' => 320,
        ]);
    }

    public function test_indice_incluye_ultima_lectura(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $sensor = $this->sensor();

        Measurement::create([
            'sensor_id' => $sensor->id, 'plot_id' => $sensor->plot_id,
            'measured_at' => now()->subHours(5)->toDateTimeString(),
            'raw_value' => 800, 'norm_value' => 31.43, 'quality' => 'ok', 'origin' => 'manual',
        ]);
        $new = Measurement::create([
            'sensor_id' => $sensor->id, 'plot_id' => $sensor->plot_id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 650, 'norm_value' => 52.86, 'quality' => 'ok', 'origin' => 'manual',
        ]);

        $response = $this->getJson('/api/v1/sensors')->assertOk();

        $this->assertSame($new->id, (int) $response->json('data.0.latest_measurement.id'));
        $this->assertSame(52.86, (float) $response->json('data.0.latest_measurement.norm_value'));
    }

    public function test_sin_lecturas_devuelve_nulo(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $this->sensor();

        $this->getJson('/api/v1/sensors')
            ->assertOk()
            ->assertJsonPath('data.0.latest_measurement', null);
    }

    public function test_agricultor_recibe_403_y_no_genera_lecturas_al_simular(): void
    {
        $sensor = $this->sensor();
        $farmerId = $sensor->plot->farmer_id;
        Sanctum::actingAs(User::factory()->create([
            'role' => 'agricultor',
            'farmer_id' => $farmerId,
        ]));

        $this->postJson("/api/v1/sensors/{$sensor->id}/simular")->assertForbidden();

        $this->assertDatabaseCount('measurements', 0);
    }

    public function test_sensor_inactivo_rechaza_simulacion_y_no_genera_lecturas(): void
    {
        $sensor = $this->sensor();
        $sensor->update(['is_active' => false]);
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $this->postJson("/api/v1/sensors/{$sensor->id}/simular")
            ->assertUnprocessable()
            ->assertJsonPath('error.message', 'No se pueden simular lecturas en un sensor inactivo.');

        $this->assertDatabaseCount('measurements', 0);
    }
}
