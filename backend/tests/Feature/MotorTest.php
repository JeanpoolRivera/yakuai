<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Evaluation;
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

class MotorTest extends TestCase
{
    use RefreshDatabase;

    private Plot $plot;

    private Sensor $sensor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CatalogSeeder::class);
        $farmer = Farmer::create(['name' => 'Test']);
        $cropId = Crop::where('code', 'papa')->firstOrFail()->id;

        // Siembra hace 70 días → etapa med (55-95): kc 1.15, zr 0.60, p 0.35.
        // Suelo franco: cc 0.27, pmp 0.12 → umbral 21.75 %.
        $this->plot = Plot::create([
            'farmer_id' => $farmer->id,
            'name' => 'P1',
            'latitude' => -12.0667,
            'longitude' => -75.2833,
            'area_m2' => 100,
            'crop_id' => $cropId,
            'sowing_date' => now()->subDays(70)->toDateString(),
            'soil_texture_code' => 'franco',
            'irrigation_system' => 'goteo',
            'irrigation_efficiency' => 0.90,
        ]);
        $this->sensor = Sensor::create([
            'plot_id' => $this->plot->id, 'type' => 'humedad', 'model' => 'YL-69',
            'dry_ref' => 1020, 'wet_ref' => 320,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']), ['*']);
    }

    private function medir(float $normPct, int $minutesAgo = 5): void
    {
        // norm% → raw: raw = dry - pct/100*(dry-wet)
        $raw = 1020 - $normPct / 100 * 700;
        Measurement::create([
            'sensor_id' => $this->sensor->id,
            'plot_id' => $this->plot->id,
            'measured_at' => now()->subMinutes($minutesAgo),
            'raw_value' => $raw,
            'norm_value' => $normPct,
            'quality' => 'ok',
            'origin' => 'demo',
        ]);
    }

    /**
     * @param  array{rain_mm?: float, rain_prob?: float}|null  $rain
     */
    private function clima(?array $rain = null, int $minutesAgo = 5): void
    {
        $now = now();
        Forecast::create([
            'plot_id' => $this->plot->id,
            'fetched_at' => $now->copy()->subMinutes($minutesAgo),
            'issued_at' => $now,
            'period_from' => $now,
            'period_to' => $now->copy()->addHours(6),
            'temp_max' => 25,
            'temp_min' => 12,
            'rain_mm' => $rain['rain_mm'] ?? 0,
            'rain_prob' => $rain['rain_prob'] ?? 0,
            'origin' => 'demo',
        ]);
    }

    private function evaluar(): mixed
    {
        return $this->postJson("/api/v1/plots/{$this->plot->id}/evaluate");
    }

    public function test_humedad_suficiente_no_riega(): void
    {
        $this->medir(25);
        $this->clima();

        $this->evaluar()
            ->assertCreated()
            ->assertJsonPath('data.result', 'no')
            ->assertJsonPath('data.reason', 'humedad_suficiente')
            ->assertJsonPath('data.stage', 'med');
    }

    public function test_bajo_umbral_riega_con_rango_exacto(): void
    {
        $this->medir(20);
        $this->clima();

        // neta=(0.27-0.20)*0.6*1000=42mm; bruto=42*100/0.9=4666.67 → 4650-4700.
        $this->evaluar()
            ->assertCreated()
            ->assertJsonPath('data.result', 'riega')
            ->assertJsonPath('data.reason', 'bajo_umbral')
            ->assertJsonPath('data.min_liters', 4650)
            ->assertJsonPath('data.max_liters', 4700)
            ->assertJsonPath('data.inputs_snapshot.lamina_neta_mm', 42)
            ->assertJsonPath('data.inputs_snapshot.umbral', 0.2175);
    }

    public function test_lluvia_suficiente_pospone(): void
    {
        $this->medir(20);
        $this->clima(['rain_mm' => 60, 'rain_prob' => 0.9]);

        $this->evaluar()
            ->assertCreated()
            ->assertJsonPath('data.result', 'espera')
            ->assertJsonPath('data.reason', 'lluvia_prevista_suficiente')
            ->assertJsonPath('data.min_liters', null);
    }

    public function test_prob_baja_no_pospone(): void
    {
        $this->medir(20);
        $this->clima(['rain_mm' => 60, 'rain_prob' => 0.6]);

        $this->evaluar()->assertCreated()->assertJsonPath('data.result', 'riega');
    }

    public function test_lluvia_insuficiente_no_pospone(): void
    {
        $this->medir(20);
        $this->clima(['rain_mm' => 2, 'rain_prob' => 0.9]);

        $this->evaluar()->assertCreated()->assertJsonPath('data.result', 'riega');
    }

    public function test_critico_riega_aunque_llueva(): void
    {
        $this->medir(10);
        $this->clima(['rain_mm' => 100, 'rain_prob' => 0.95]);

        $this->evaluar()
            ->assertCreated()
            ->assertJsonPath('data.result', 'riega')
            ->assertJsonPath('data.reason', 'humedad_critica')
            ->assertJsonPath('data.is_critical', true);
    }

    public function test_en_umbral_exacta_evalua_riego(): void
    {
        $this->medir(21.75);
        $this->clima();

        $this->evaluar()->assertCreated()->assertJsonPath('data.result', 'riega');
    }

    public function test_lectura_vencida_incompleta(): void
    {
        $this->medir(20, 40);
        $this->clima();

        $this->evaluar()
            ->assertStatus(422)
            ->assertJsonPath('data.result', 'incompleta')
            ->assertJsonPath('data.reason', 'sin_humedad_valida');
    }

    public function test_clima_vencido_se_auto_refresca(): void
    {
        $this->medir(20);
        $this->clima(null, 200);

        // Auto-refresh OWM (>2h): con clima vencido se trae uno fresco y evalúa.
        $this->evaluar()
            ->assertCreated()
            ->assertJsonPath('data.result', 'riega');
    }

    public function test_sin_medicion_incompleta(): void
    {
        $this->clima();

        $this->evaluar()->assertStatus(422)->assertJsonPath('data.reason', 'sin_humedad_valida');
    }

    public function test_anomala_no_se_usa(): void
    {
        $this->medir(10);
        Measurement::where('plot_id', $this->plot->id)->update(['quality' => 'anomalo']);
        $this->medir(25, 10);
        $this->clima();

        $this->evaluar()->assertCreated()->assertJsonPath('data.result', 'no');
    }

    public function test_misma_hora_no_duplica(): void
    {
        $this->medir(20);
        $this->clima();

        $first = $this->evaluar()->assertCreated()->json('data.id');
        $second = $this->evaluar()->assertOk()->json('data.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, Evaluation::count());
    }

    public function test_confianza_alta_con_datos_frescos_y_media_con_viejos(): void
    {
        $this->medir(20);
        $this->clima();
        $this->evaluar()->assertCreated()->assertJsonPath('data.confidence', 'alta');

        Measurement::query()->delete();
        Evaluation::query()->delete();
        $this->medir(20, 20);
        $this->clima(null, 90);
        $this->evaluar()->assertCreated()->assertJsonPath('data.confidence', 'media');
    }

    public function test_snapshot_y_et0_sanos(): void
    {
        $this->medir(20);
        $this->clima();

        $response = $this->evaluar()->assertCreated();
        $snap = $response->json('data.inputs_snapshot');

        $this->assertSame('papa', $snap['crop_code']);
        $this->assertSame('franco', $snap['soil_code']);
        $this->assertSame(1.15, (float) $snap['kc']);
        $this->assertGreaterThan(2.0, (float) $snap['et0_mm_dia']);
        $this->assertLessThan(8.0, (float) $snap['et0_mm_dia']);
        $this->assertNotNull($response->json('data.next_at'));
    }

    public function test_agricultor_ajeno_no_evalua(): void
    {
        $this->medir(20);
        $this->clima();
        $ajeno = Farmer::create(['name' => 'Ajeno']);
        Sanctum::actingAs(User::factory()->create(['role' => 'agricultor', 'farmer_id' => $ajeno->id]), ['evaluar']);

        $this->evaluar()->assertForbidden();
    }

    public function test_historial_y_detalle(): void
    {
        $this->medir(20);
        $this->clima();
        $id = $this->evaluar()->assertCreated()->json('data.id');

        $this->getJson('/api/v1/evaluations?plot_id='.$this->plot->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/evaluations/{$id}")
            ->assertOk()
            ->assertJsonPath('data.inputs_snapshot.stage', 'med');
    }
}
