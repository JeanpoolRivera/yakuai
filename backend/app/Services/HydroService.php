<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\SoilTexture;
use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Motor hídrico v1 (FAO-56 + reglas README §6).
 * Puro: recibe modelos cargados y devuelve el cálculo + snapshot.
 * No toca BD ni reloj externo salvo el instante recibido.
 */
class HydroService
{
    public const PROB_MIN = 0.70;

    public const RAIN_EFF = 0.80;

    public const MEASURE_MAX_MIN = 30;

    public const FORECAST_MAX_MIN = 180;

    public const WAIT_HOURS = 6;

    /**
     * Radiación extraterrestre diaria Ra en mm/día equiv. (FAO-56 Ec. 21-28).
     */
    public function extraterrestrialRadiation(float $latDeg, CarbonInterface $date): float
    {
        $lat = deg2rad($latDeg);
        $j = $date->dayOfYear;
        $dr = 1 + 0.033 * cos(2 * M_PI * $j / 365);
        $delta = 0.409 * sin(2 * M_PI * $j / 365 - 1.39);
        $ws = acos(max(-1.0, min(1.0, -tan($lat) * tan($delta))));
        $raMj = 24 * 60 / M_PI * 0.0820 * $dr
            * ($ws * sin($lat) * sin($delta) + cos($lat) * cos($delta) * sin($ws));

        return round($raMj * 0.408, 3);
    }

    /**
     * ET0 Hargreaves solo temperatura (FAO-56 Ec. 52).
     */
    public function et0Hargreaves(float $tmax, float $tmin, float $raMmDay): float
    {
        $tmean = ($tmax + $tmin) / 2;

        return round(0.0023 * ($tmean + 17.8) * sqrt(max(0.0, $tmax - $tmin)) * $raMmDay, 2);
    }

    /**
     * @return array{result: string, stage: string|null, min_liters: float|null, max_liters: float|null, confidence: string|null, reason: string, next_at: Carbon|null, is_critical: bool, snapshot: array<string, mixed>}
     */
    public function evaluate(Plot $plot, ?Measurement $measurement, ?Forecast $forecast, CarbonInterface $now): array
    {
        $crop = Crop::with('stages')->findOrFail($plot->crop_id);
        $soil = SoilTexture::where('code', $plot->soil_texture_code)->firstOrFail();

        $snapshot = [
            'fuente' => 'FAO-56 referencia, a validar en Chupaca',
            'crop_code' => $crop->code,
            'soil_code' => $soil->code,
            'cc' => (float) $soil->field_capacity,
            'pmp' => (float) $soil->wilting_point,
            'area_m2' => (float) $plot->area_m2,
            'efficiency' => (float) $plot->irrigation_efficiency,
        ];

        if ($measurement === null || $measurement->quality !== 'ok'
            || $measurement->measured_at->diffInMinutes($now) > self::MEASURE_MAX_MIN
        ) {
            return $this->incomplete($snapshot, 'sin_humedad_valida', $now);
        }

        if ($forecast === null || $forecast->fetched_at->diffInMinutes($now) > self::FORECAST_MAX_MIN) {
            return $this->incomplete($snapshot, 'sin_clima_valido', $now);
        }

        $stage = $this->stageFor($crop, $plot->sowing_date, $now);
        $snapshot['stage'] = $stage->stage;
        $snapshot['kc'] = (float) $stage->kc;
        $snapshot['zr_m'] = (float) $stage->root_depth_m;
        $snapshot['p'] = (float) $stage->depletion_fraction;
        $snapshot['humedad_pct'] = (float) $measurement->norm_value;
        $snapshot['rain_mm'] = (float) $forecast->rain_mm;
        $snapshot['rain_prob'] = (float) $forecast->rain_prob;

        $ra = $this->extraterrestrialRadiation((float) $plot->latitude, $now);
        $tempAsumida = $forecast->temp_max === null || $forecast->temp_min === null;
        $et0 = $this->et0Hargreaves(
            (float) ($forecast->temp_max ?? 24),
            (float) ($forecast->temp_min ?? 12),
            $ra
        );
        $snapshot['et0_mm_dia'] = $et0;
        $snapshot['etc_mm_dia'] = round($et0 * (float) $stage->kc, 2);
        $snapshot['temp_asumida'] = $tempAsumida;

        $cc = (float) $soil->field_capacity;
        $pmp = (float) $soil->wilting_point;
        $theta = (float) $measurement->norm_value / 100;
        $umbral = $cc - (float) $stage->depletion_fraction * ($cc - $pmp);
        $snapshot['umbral'] = round($umbral, 4);

        $fresh = $measurement->measured_at->diffInMinutes($now) <= 15
            && $forecast->fetched_at->diffInMinutes($now) <= 60;
        $confidence = $fresh ? 'alta' : 'media';

        if ($theta > $umbral) {
            return [
                'result' => 'no', 'stage' => $stage->stage,
                'min_liters' => null, 'max_liters' => null,
                'confidence' => $confidence, 'reason' => 'humedad_suficiente',
                'next_at' => $now->copy()->addHours(12),
                'is_critical' => false, 'snapshot' => $snapshot,
            ];
        }

        $netMm = max(0.0, ($cc - $theta)) * (float) $stage->root_depth_m * 1000;
        $snapshot['lamina_neta_mm'] = round($netMm, 2);

        $isCritical = $theta <= $pmp;
        $waits = ! $isCritical
            && (float) $forecast->rain_prob >= self::PROB_MIN
            && (float) $forecast->rain_mm * self::RAIN_EFF >= $netMm
            && $netMm > 0;

        if ($waits) {
            return [
                'result' => 'espera', 'stage' => $stage->stage,
                'min_liters' => null, 'max_liters' => null,
                'confidence' => $confidence, 'reason' => 'lluvia_prevista_suficiente',
                'next_at' => $now->copy()->addHours(self::WAIT_HOURS),
                'is_critical' => false, 'snapshot' => $snapshot,
            ];
        }

        $gross = $netMm * (float) $plot->area_m2 / (float) $plot->irrigation_efficiency;
        $min = floor($gross / 50) * 50;
        $max = $min + 50;
        $snapshot['volumen_bruto_L'] = round($gross, 2);

        // Plan ejecutable v1.1: siguiente riego a cualquier hora buena.
        // Crítico → ahora. Mañana 05:30–10:00 y tarde 16:00–19:00 son ventanas
        // buenas; mediodía 11:00–15:00 se evita salvo crítico.
        $litros = (int) round($gross);
        $flow = (float) ($plot->flow_lpm ?? 0);
        $minutos = $flow > 0 ? (int) ceil($litros / $flow) : null;
        $ventanaMin = 90; // jornada base 05:30–07:00 para partición
        $inicio = $this->proximoInicio($now, $isCritical);
        $motivoHora = $isCritical ? 'ahora (crítico)'
            : ($inicio->format('H:i') === '05:30' ? 'próxima ventana buena (mañana)'
            : 'próxima ventana buena (hoy)');
        if ($minutos === null) {
            $snapshot['plan'] = [
                'litros' => $litros,
                'minutos' => null,
                'inicio' => $inicio->toDateTimeString(),
                'fin' => null,
                'jornadas' => 1,
                'nota' => 'Anota tu caudal (flow_lpm) para calcular minutos.',
            ];
        } elseif ($minutos <= $ventanaMin) {
            $snapshot['plan'] = [
                'litros' => $litros,
                'minutos' => $minutos,
                'inicio' => $inicio->toDateTimeString(),
                'fin' => $inicio->copy()->addMinutes($minutos)->toDateTimeString(),
                'jornadas' => 1,
                'nota' => null,
            ];
        } else {
            $jornadas = (int) ceil($minutos / $ventanaMin);
            $snapshot['plan'] = [
                'litros' => $litros,
                'minutos' => $minutos,
                'inicio' => $inicio->toDateTimeString(),
                'fin' => $inicio->copy()->addDays($jornadas - 1)->setTime(5, 30)->addMinutes($minutos - ($jornadas - 1) * $ventanaMin)->toDateTimeString(),
                'jornadas' => $jornadas,
                'nota' => "No entra en una ventana: partir en {$jornadas} mañanas 05:30–07:00.",
            ];
        }
        $snapshot['proximo_riego'] = [
            'fecha' => $snapshot['plan']['inicio'],
            'litros' => $litros,
            'motivo' => $motivoHora,
        ];

        return [
            'result' => 'riega', 'stage' => $stage->stage,
            'min_liters' => $min, 'max_liters' => $max,
            'confidence' => $confidence, 'reason' => $isCritical ? 'humedad_critica' : 'bajo_umbral',
            'next_at' => $now->copy()->addHours(24),
            'is_critical' => $isCritical, 'snapshot' => $snapshot,
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{result: string, stage: string|null, min_liters: float|null, max_liters: float|null, confidence: string|null, reason: string, next_at: Carbon|null, is_critical: bool, snapshot: array<string, mixed>}
     */
    private function incomplete(array $snapshot, string $reason, CarbonInterface $now): array
    {
        return [
            'result' => 'incompleta', 'stage' => null,
            'min_liters' => null, 'max_liters' => null,
            'confidence' => null, 'reason' => $reason,
            'next_at' => $now->copy()->addHour(),
            'is_critical' => false, 'snapshot' => $snapshot,
        ];
    }

    /**
     * Próxima hora buena para regar: crítico → ahora; mañana 05:30–10:00
     * y tarde 16:00–19:00 son buenas; mediodía se evita salvo crítico.
     */
    private function proximoInicio(CarbonInterface $now, bool $isCritical): CarbonInterface
    {
        if ($isCritical) {
            return $now->copy();
        }

        $h = (int) $now->format('H');
        $m = (int) $now->format('i');
        $hm = $h * 60 + $m;

        // Mañana 05:30–10:00 → en 15 min.
        if ($hm >= 5 * 60 + 30 && $hm < 10 * 60) {
            return $now->copy()->addMinutes(15);
        }

        // Tarde 16:00–19:00 → en 15 min.
        if ($hm >= 16 * 60 && $hm < 19 * 60) {
            return $now->copy()->addMinutes(15);
        }

        // Antes de las 05:30 → hoy 05:30.
        if ($hm < 5 * 60 + 30) {
            return $now->copy()->setTime(5, 30);
        }

        // Entre 10:00 y 16:00 (sol fuerte) → hoy 16:00.
        if ($hm < 16 * 60) {
            return $now->copy()->setTime(16, 0);
        }

        // Después de las 19:00 → mañana 05:30.
        return $now->copy()->addDay()->setTime(5, 30);
    }

    private function stageFor(Crop $crop, mixed $sowingDate, CarbonInterface $now): mixed
    {
        $days = (int) $sowingDate->copy()->startOfDay()->diffInDays($now->copy()->startOfDay());
        $acc = 0;

        foreach ($crop->stages()->orderBy('id')->get() as $stage) {
            $acc += (int) $stage->days;

            if ($days < $acc) {
                return $stage;
            }
        }

        return $crop->stages()->orderBy('id', 'desc')->firstOrFail();
    }
}
