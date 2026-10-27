<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IngestionTest extends TestCase
{
    use RefreshDatabase;

    private function plot(): Plot
    {
        $this->seed(CatalogSeeder::class);
        $farmer = Farmer::create(['name' => 'Test']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        return Plot::create([
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
    }

    public function test_ingesta_valida_normaliza_y_marca_ok(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();
        $sensor = Sensor::create([
            'plot_id' => $plot->id, 'type' => 'humedad', 'model' => 'YL-69',
            'dry_ref' => 1020, 'wet_ref' => 320,
        ]);

        $response = $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 650,
        ])->assertCreated();

        // (1020-650)/(1020-320)*100 = 52.86
        $this->assertSame(52.86, (float) $response->json('data.norm_value'));
        $this->assertSame('ok', $response->json('data.quality'));
        $this->assertSame('ok', $sensor->fresh()->status);
    }

    public function test_valor_imposible_va_a_cuarentena(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();
        $sensor = Sensor::create([
            'plot_id' => $plot->id, 'type' => 'humedad', 'model' => 'YL-69',
            'dry_ref' => 1020, 'wet_ref' => 320,
        ]);

        $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 5000,
        ])->assertCreated()
            ->assertJsonPath('data.quality', 'anomalo')
            ->assertJsonPath('data.norm_value', null);

        $this->assertSame('anomalo', $sensor->fresh()->status);
    }

    public function test_duplicado_devuelve_409_con_existente(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();
        $sensor = Sensor::create([
            'plot_id' => $plot->id, 'type' => 'lluvia', 'model' => 'FC-37',
        ]);
        $at = now()->toDateTimeString();

        $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id, 'measured_at' => $at, 'raw_value' => 1,
        ])->assertCreated();

        $this->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id, 'measured_at' => $at, 'raw_value' => 1,
        ])->assertStatus(409);
    }

    public function test_sensor_exige_calibracion_en_humedad(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $this->postJson('/api/v1/sensors', [
            'plot_id' => $plot->id, 'type' => 'humedad',
        ])->assertUnprocessable();
    }

    public function test_comando_marca_sin_datos_tras_3h(): void
    {
        $plot = $this->plot();
        Sensor::create(['plot_id' => $plot->id, 'type' => 'aire_temp', 'model' => 'DHT11']);

        $this->artisan('yakuai:sensores:revisar')->assertSuccessful();
        $this->assertSame('sin_datos', Sensor::firstOrFail()->fresh()->status);
    }

    public function test_token_sensor_solo_ingiere(): void
    {
        $tecnico = User::factory()->create(['role' => 'tecnico']);
        $token = $tecnico->createToken('sensor-1', ['ingerir'])->plainTextToken;
        $plot = $this->plot();
        $sensor = Sensor::create([
            'plot_id' => $plot->id, 'type' => 'lluvia', 'model' => 'FC-37',
        ]);

        $this->withToken($token)->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 1,
        ])->assertCreated();

        $this->withToken($token)->getJson('/api/v1/plots')->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/user')->assertForbidden();
    }
}
