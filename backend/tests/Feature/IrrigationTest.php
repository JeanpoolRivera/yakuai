<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Irrigation;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IrrigationTest extends TestCase
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
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']), ['*']);
    }

    public function test_registra_riego_con_recomendado_y_aplicado(): void
    {
        $this->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'recommended_liters' => 4650,
            'applied_liters' => 4800,
            'note' => 'Riego de prueba',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'activo')
            ->assertJsonPath('data.origin', 'manual');
    }

    public function test_corregir_crea_nuevo_y_marca_anterior(): void
    {
        $id = $this->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'applied_liters' => 4800,
        ])->assertCreated()->json('data.id');

        $nuevo = $this->postJson("/api/v1/irrigations/{$id}/corregir", [
            'applied_liters' => 5000,
            'motivo' => 'Medí mal el contador',
        ])->assertCreated()->json('data');

        $this->assertSame(5000, (int) $nuevo['applied_liters']);
        $this->assertSame($id, $nuevo['supersedes_id']);
        $this->assertSame('corregido', Irrigation::findOrFail($id)->status);
    }

    public function test_no_corregir_dos_veces(): void
    {
        $id = $this->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'applied_liters' => 4800,
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/irrigations/{$id}/anular", ['motivo' => 'No se regó'])
            ->assertOk()
            ->assertJsonPath('data.status', 'anulado');

        $this->postJson("/api/v1/irrigations/{$id}/corregir", [
            'applied_liters' => 1,
            'motivo' => 'x',
        ])->assertStatus(422);
    }

    public function test_agricultor_registra_su_riego(): void
    {
        Sanctum::actingAs(
            User::factory()->create(['role' => 'agricultor', 'farmer_id' => $this->plot->farmer_id]),
            ['regar']
        );

        $this->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'applied_liters' => 800,
        ])->assertCreated();
    }

    public function test_alertas_listan_sensor_y_criticos(): void
    {
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id, 'type' => 'aire_temp', 'model' => 'DHT11',
        ]);
        $sensor->update(['status' => 'sin_datos']);

        $this->getJson('/api/v1/alerts')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'sensor_sin_datos']);
    }
}
