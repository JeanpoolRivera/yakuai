<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farmer;
use App\Models\Plot;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WeatherTest extends TestCase
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
            'latitude' => -12.0667,
            'longitude' => -75.2833,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);
    }

    public function test_refresh_trae_owm_en_vivo(): void
    {
        Http::fake(['api.openweathermap.org/*' => Http::response([
            'list' => [
                ['rain' => ['3h' => 4.0], 'pop' => 0.8, 'main' => ['temp_max' => 25, 'temp_min' => 12, 'temp' => 20]],
                ['rain' => ['3h' => 6.0], 'pop' => 0.9, 'main' => ['temp_max' => 24, 'temp_min' => 11, 'temp' => 19]],
            ],
        ], 200)]);
        config(['services.owm.key' => 'clave-test']);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $response = $this->postJson("/api/v1/plots/{$plot->id}/weather/refresh")
            ->assertCreated();

        $this->assertSame('owm', $response->json('data.origin'));
        $this->assertSame(10.0, (float) $response->json('data.rain_mm'));
        $this->assertNotNull($response->json('data.fetched_at'));
        $this->assertNotNull($response->json('data.period_to'));
    }

    public function test_owm_401_cae_a_demo_sin_romper(): void
    {
        config(['services.owm.key' => 'invalida']);
        Http::fake(['api.openweathermap.org/*' => Http::response(['message' => 'Invalid API key'], 401)]);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $this->postJson("/api/v1/plots/{$plot->id}/weather/refresh")
            ->assertCreated()
            ->assertJsonPath('data.origin', 'owm_fallo_401');
    }

    public function test_agricultor_tambien_actualiza_clima_en_vivo(): void
    {
        Http::fake(['api.openweathermap.org/*' => Http::response([
            'list' => [
                ['rain' => ['3h' => 1.0], 'pop' => 0.5, 'main' => ['temp_max' => 25, 'temp_min' => 12, 'temp' => 20]],
            ],
        ], 200)]);
        config(['services.owm.key' => 'clave-test']);

        $this->seed(CatalogSeeder::class);
        $farmer = Farmer::create(['name' => 'Test']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;
        $plot = Plot::create([
            'farmer_id' => $farmer->id,
            'name' => 'P1',
            'latitude' => -12.0667,
            'longitude' => -75.2833,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor', 'farmer_id' => $farmer->id]));

        $this->postJson("/api/v1/plots/{$plot->id}/weather/refresh")
            ->assertCreated()
            ->assertJsonPath('data.origin', 'owm');
    }

    public function test_latest_404_sin_pronostico(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $this->getJson("/api/v1/plots/{$plot->id}/weather")->assertNotFound();
    }
}
