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

    public function test_demo_guarda_mismo_esquema(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $response = $this->postJson("/api/v1/plots/{$plot->id}/weather/refresh", [
            'demo' => ['rain_mm' => 10, 'rain_prob' => 0.8, 'temp_max' => 25, 'temp_min' => 12],
        ])->assertCreated();

        $this->assertSame('demo', $response->json('data.origin'));
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

    public function test_agricultor_no_puede_actualizar_clima(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor']));
        $plot = $this->plot();

        $this->postJson("/api/v1/plots/{$plot->id}/weather/refresh", ['demo' => []])
            ->assertForbidden();
    }

    public function test_latest_404_sin_pronostico(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        $plot = $this->plot();

        $this->getJson("/api/v1/plots/{$plot->id}/weather")->assertNotFound();
    }
}
