<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Evaluation;
use App\Models\Farmer;
use App\Models\Irrigation;
use App\Models\Plot;
use App\Models\Sensor;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccessMatrixTest extends TestCase
{
    use RefreshDatabase;

    private Farmer $farmer;

    private Plot $plot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogSeeder::class);
        $this->farmer = Farmer::create(['name' => 'Agricultor de prueba']);
        $this->plot = Plot::create([
            'farmer_id' => $this->farmer->id,
            'name' => 'Parcela de prueba',
            'latitude' => -12.06,
            'longitude' => -75.28,
            'area_m2' => 100,
            'crop_id' => Crop::where('code', 'papa')->value('id'),
            'sowing_date' => now()->subDays(10)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.9,
        ]);
    }

    public function test_matriz_de_lectura_por_rol_en_rutas_protegidas(): void
    {
        $routes = [
            '/api/v1/auth/me' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/crops' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/soil-textures' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/users' => ['admin' => 200, 'tecnico' => 403, 'agricultor' => 403],
            '/api/v1/farmers' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 403],
            '/api/v1/plots' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/sensors' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/measurements' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/evaluations' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/irrigations' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/alerts' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 200],
            '/api/v1/validation' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 403],
            '/api/v1/metrics/summary' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 403],
            '/api/v1/metrics/evaluations' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 403],
            '/api/v1/metrics/sensors' => ['admin' => 200, 'tecnico' => 200, 'agricultor' => 403],
        ];

        foreach (['admin', 'tecnico', 'agricultor'] as $role) {
            $user = User::factory()->create([
                'role' => $role,
                'farmer_id' => $role === 'agricultor' ? $this->farmer->id : null,
            ]);
            Sanctum::actingAs($user, ['*']);

            foreach ($routes as $uri => $expectedByRole) {
                $this->getJson($uri)->assertStatus($expectedByRole[$role]);
            }
        }
    }

    public function test_token_solo_lectura_no_puede_escribir_ni_evaluar(): void
    {
        $user = User::factory()->create(['role' => 'agricultor', 'farmer_id' => $this->farmer->id]);
        $token = $user->createToken('read-only', ['ver'])->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/crops')->assertOk();
        $this->withToken($token)->postJson('/api/v1/plots/'.$this->plot->id.'/evaluate')->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'applied_liters' => 100,
        ])->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/measurements')->assertForbidden();
    }

    public function test_token_de_evaluacion_solo_ejecuta_evaluacion_de_su_parcela(): void
    {
        Evaluation::create([
            'plot_id' => $this->plot->id,
            'evaluated_at' => now()->startOfHour(),
            'stage' => 'ini',
            'inputs_snapshot' => ['humidity' => 30],
            'result' => 'no',
            'reason' => 'suelo_humedo',
        ]);
        $user = User::factory()->create(['role' => 'agricultor', 'farmer_id' => $this->farmer->id]);
        $token = $user->createToken('evaluation-only', ['evaluar'])->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/plots/'.$this->plot->id.'/evaluate')
            ->assertOk()->assertJsonPath('data.result', 'no');
        $this->withToken($token)->getJson('/api/v1/crops')->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/irrigations')->assertForbidden();
    }

    public function test_token_de_riego_no_puede_corregir_anular_ni_leer(): void
    {
        $user = User::factory()->create(['role' => 'agricultor', 'farmer_id' => $this->farmer->id]);
        $token = $user->createToken('irrigation-only', ['regar'])->plainTextToken;
        $created = $this->withToken($token)->postJson('/api/v1/irrigations', [
            'plot_id' => $this->plot->id,
            'occurred_at' => now()->toDateTimeString(),
            'applied_liters' => 100,
        ])->assertCreated();
        $id = $created->json('data.id');

        $this->withToken($token)->postJson('/api/v1/irrigations/'.$id.'/corregir', [
            'applied_liters' => 120,
            'motivo' => 'Corrección de prueba',
        ])->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/irrigations/'.$id.'/anular', [
            'motivo' => 'Anulación de prueba',
        ])->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/crops')->assertForbidden();
    }

    public function test_token_de_ingesta_solo_puede_registrar_mediciones(): void
    {
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id,
            'type' => 'humedad',
            'model' => 'YL-69',
            'dry_ref' => 1020,
            'wet_ref' => 320,
        ]);
        $user = User::factory()->create(['role' => 'tecnico']);
        $token = $user->createToken('sensor-ingestion', ['ingerir'])->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/measurements', [
            'sensor_id' => $sensor->id,
            'measured_at' => now()->toDateTimeString(),
            'raw_value' => 650,
        ])->assertCreated();
        $this->withToken($token)->getJson('/api/v1/crops')->assertForbidden();
        $this->withToken($token)->postJson('/api/v1/irrigations')->assertForbidden();
    }

    public function test_matriz_de_escritura_deniega_operaciones_exclusivas_por_rol(): void
    {
        $technician = User::factory()->create(['role' => 'tecnico']);
        $farmerUser = User::factory()->create(['role' => 'agricultor', 'farmer_id' => $this->farmer->id]);
        $otherFarmer = Farmer::create(['name' => 'Otro agricultor']);
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id,
            'type' => 'humedad',
            'model' => 'YL-69',
            'dry_ref' => 1020,
            'wet_ref' => 320,
        ]);
        $irrigation = Irrigation::create([
            'plot_id' => $this->plot->id,
            'occurred_at' => now(),
            'applied_liters' => 100,
            'status' => 'registrado',
        ]);
        $otherUser = User::factory()->create(['role' => 'agricultor', 'farmer_id' => $otherFarmer->id]);

        $technicianOnlyDenials = [
            ['POST', '/api/v1/users', []],
            ['PATCH', '/api/v1/users/'.$otherUser->id, []],
        ];
        Sanctum::actingAs($technician, ['*']);
        foreach ($technicianOnlyDenials as [$method, $uri, $payload]) {
            $this->json($method, $uri, $payload)->assertForbidden();
        }

        $farmerDenials = [
            ['POST', '/api/v1/users', []],
            ['PATCH', '/api/v1/users/'.$otherUser->id, []],
            ['POST', '/api/v1/farmers', []],
            ['PATCH', '/api/v1/farmers/'.$otherFarmer->id, []],
            ['POST', '/api/v1/plots', []],
            ['PATCH', '/api/v1/plots/'.$this->plot->id, []],
            ['POST', '/api/v1/sensors', []],
            ['PATCH', '/api/v1/sensors/'.$sensor->id, []],
            ['POST', '/api/v1/sensors/'.$sensor->id.'/simular', []],
            ['POST', '/api/v1/irrigations/'.$irrigation->id.'/corregir', []],
            ['POST', '/api/v1/irrigations/'.$irrigation->id.'/anular', []],
        ];
        Sanctum::actingAs($farmerUser, ['*']);
        foreach ($farmerDenials as [$method, $uri, $payload]) {
            $this->json($method, $uri, $payload)->assertForbidden();
        }
    }

    public function test_todas_las_rutas_privadas_rechazan_solicitudes_sin_token(): void
    {
        $sensor = Sensor::create([
            'plot_id' => $this->plot->id,
            'type' => 'humedad',
            'model' => 'YL-69',
            'dry_ref' => 1020,
            'wet_ref' => 320,
        ]);
        $evaluation = Evaluation::create([
            'plot_id' => $this->plot->id,
            'evaluated_at' => now()->startOfHour(),
            'stage' => 'ini',
            'inputs_snapshot' => ['humidity' => 30],
            'result' => 'no',
            'reason' => 'suelo_humedo',
        ]);

        $routes = [
            ['GET', '/api/v1/user'],
            ['GET', '/api/v1/auth/me'], ['POST', '/api/v1/auth/logout'], ['POST', '/api/v1/auth/refresh'],
            ['GET', '/api/v1/users'], ['POST', '/api/v1/users'], ['GET', '/api/v1/users/1'], ['PATCH', '/api/v1/users/1'],
            ['GET', '/api/v1/crops'], ['GET', '/api/v1/crops/1'],
            ['GET', '/api/v1/soil-textures'], ['GET', '/api/v1/soil-textures/franco'],
            ['GET', '/api/v1/farmers'], ['POST', '/api/v1/farmers'], ['GET', '/api/v1/farmers/1'], ['PATCH', '/api/v1/farmers/1'],
            ['GET', '/api/v1/plots'], ['POST', '/api/v1/plots'], ['GET', '/api/v1/plots/'.$this->plot->id], ['PATCH', '/api/v1/plots/'.$this->plot->id],
            ['GET', '/api/v1/sensors'], ['POST', '/api/v1/sensors'], ['GET', '/api/v1/sensors/'.$sensor->id], ['PATCH', '/api/v1/sensors/'.$sensor->id], ['POST', '/api/v1/sensors/'.$sensor->id.'/simular'],
            ['GET', '/api/v1/measurements'], ['POST', '/api/v1/measurements'],
            ['GET', '/api/v1/plots/'.$this->plot->id.'/weather'], ['POST', '/api/v1/plots/'.$this->plot->id.'/weather/refresh'],
            ['POST', '/api/v1/plots/'.$this->plot->id.'/evaluate'], ['GET', '/api/v1/evaluations'], ['GET', '/api/v1/evaluations/'.$evaluation->id], ['GET', '/api/v1/evaluations/'.$evaluation->id.'/mensaje'],
            ['GET', '/api/v1/irrigations'], ['POST', '/api/v1/irrigations'], ['POST', '/api/v1/irrigations/1/corregir'], ['POST', '/api/v1/irrigations/1/anular'],
            ['GET', '/api/v1/alerts'], ['GET', '/api/v1/validation'], ['GET', '/api/v1/metrics/summary'], ['GET', '/api/v1/metrics/evaluations'], ['GET', '/api/v1/metrics/sensors'],
        ];

        foreach ($routes as [$method, $uri]) {
            $this->json($method, $uri)->assertUnauthorized();
        }
    }
}
