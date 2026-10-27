<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\CropStage;
use App\Models\Farmer;
use App\Models\Plot;
use App\Models\SoilTexture;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogPlotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogSeeder::class);
    }

    public function test_catalogos_precargados(): void
    {
        $this->assertSame(4, Crop::count());
        $this->assertSame(16, CropStage::count());
        $this->assertSame(5, SoilTexture::count());
        $this->assertNotEmpty(CropStage::firstOrFail()->source);
        $this->assertNotEmpty(CropStage::firstOrFail()->source_url);
        $this->assertNotNull(CropStage::firstOrFail()->reviewed_at);
        $this->assertNotEmpty(SoilTexture::firstOrFail()->source);
        $this->assertNotEmpty(SoilTexture::firstOrFail()->source_url);
        $this->assertNotNull(SoilTexture::firstOrFail()->reviewed_at);
    }

    public function test_rutas_protegidas_exigen_token(): void
    {
        $this->getJson('/api/v1/crops')->assertUnauthorized();
        $this->getJson('/api/v1/plots')->assertUnauthorized();
    }

    public function test_tecnico_crea_agricultor_y_parcela(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $farmer = $this->postJson('/api/v1/farmers', ['name' => 'Juan Pérez'])
            ->assertCreated()->json('data');

        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        $plot = $this->postJson('/api/v1/plots', [
            'farmer_id' => $farmer['id'],
            'name' => 'Parcela alta',
            'latitude' => -12.0667,
            'longitude' => -75.2833,
            'boundary' => [[-75.2833, -12.0667], [-75.2830, -12.0667], [-75.2830, -12.0660]],
            'area_m2' => 100,
            'area_origin' => 'manual',
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(30)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'gravedad',
            'irrigation_efficiency' => 0.60,
            'flow_lpm' => 20,
        ])->assertCreated()->json('data');

        $this->assertSame('Parcela alta', $plot['name']);
        $this->assertSame(1, Farmer::count());
    }

    public function test_parcela_rechaza_area_invalida(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $farmer = Farmer::create(['name' => 'X']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        $this->postJson('/api/v1/plots', [
            'farmer_id' => $farmer->id,
            'name' => 'Mala',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 0,
            'crop_id' => $cropId,
            'sowing_date' => now()->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ])->assertUnprocessable();
    }

    public function test_parcela_rechaza_contorno_con_menos_de_tres_puntos(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $farmer = Farmer::create(['name' => 'Contorno incompleto']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;
        $payload = [
            'farmer_id' => $farmer->id,
            'name' => 'Parcela con contorno incompleto',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'area_origin' => 'manual',
            'crop_id' => $cropId,
            'sowing_date' => now()->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
            'boundary' => [[-75.2833, -12.0667], [-75.2830, -12.0667]],
        ];

        $this->postJson('/api/v1/plots', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('errors.boundary.0', 'El contorno debe tener al menos tres puntos.');
    }

    public function test_parcela_rechaza_area_de_dibujo_sin_contorno(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $farmer = Farmer::create(['name' => 'Área dibujada']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;
        $payload = [
            'farmer_id' => $farmer->id,
            'name' => 'Parcela sin contorno',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'area_origin' => 'dibujo',
            'crop_id' => $cropId,
            'sowing_date' => now()->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
            'boundary' => null,
        ];

        $this->postJson('/api/v1/plots', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('errors.boundary.0', 'Dibuja un contorno válido antes de usar el área calculada del mapa.');
    }

    public function test_agricultor_no_puede_crear_parcelas(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor']));

        $this->postJson('/api/v1/farmers', ['name' => 'No'])
            ->assertForbidden();
    }

    public function test_agricultor_solo_ve_sus_parcelas(): void
    {
        $propio = Farmer::create(['name' => 'Propio']);
        $ajeno = Farmer::create(['name' => 'Ajeno']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;
        $base = [
            'name' => 'P', 'latitude' => -12.06, 'longitude' => -75.28,
            'area_m2' => 100, 'crop_id' => $cropId,
            'sowing_date' => now()->toDateString(), 'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo', 'irrigation_efficiency' => 0.90,
        ];
        Plot::create($base + ['farmer_id' => $propio->id]);
        $otra = Plot::create($base + ['farmer_id' => $ajeno->id, 'name' => 'Q']);

        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor', 'farmer_id' => $propio->id]));

        $this->getJson('/api/v1/plots?per_page=100')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/v1/plots/{$otra->id}")->assertForbidden();
    }
}
