<?php

namespace App\Services;

/**
 * Normaliza lecturas crudas y decide su calidad.
 * Reglas v1 (README §6): YL-69 0-1023 con calibración de 2 puntos,
 * DHT11 temp -10..60, HR 0..100, FC-37 solo 0/1, YF-S201 0..60 L/min.
 */
class SensorNormalizer
{
    /**
     * @return array{quality: string, norm: float|null}
     */
    public function normalize(string $type, float $raw, ?int $dryRef, ?int $wetRef): array
    {
        return match ($type) {
            'humedad' => $this->moisture($raw, $dryRef, $wetRef),
            'aire_temp' => $this->range($raw, -10.0, 60.0),
            'aire_hr' => $this->range($raw, 0.0, 100.0),
            'lluvia' => $this->discrete($raw, [0.0, 1.0]),
            'caudal' => $this->range($raw, 0.0, 60.0),
            default => ['quality' => 'anomalo', 'norm' => null],
        };
    }

    /**
     * @return array{quality: string, norm: float|null}
     */
    private function moisture(float $raw, ?int $dryRef, ?int $wetRef): array
    {
        if ($dryRef === null || $wetRef === null || $dryRef === $wetRef) {
            return ['quality' => 'anomalo', 'norm' => null];
        }

        $low = min($dryRef, $wetRef) - 100;
        $high = max($dryRef, $wetRef) + 100;

        if ($raw < $low || $raw > $high || $raw < 0 || $raw > 1023) {
            return ['quality' => 'anomalo', 'norm' => null];
        }

        $pct = ($dryRef - $raw) / ($dryRef - $wetRef) * 100;

        return ['quality' => 'ok', 'norm' => round(max(0.0, min(100.0, $pct)), 2)];
    }

    /**
     * @return array{quality: string, norm: float|null}
     */
    private function range(float $raw, float $min, float $max): array
    {
        if ($raw < $min || $raw > $max) {
            return ['quality' => 'anomalo', 'norm' => null];
        }

        return ['quality' => 'ok', 'norm' => round($raw, 2)];
    }

    /**
     * @param  list<float>  $allowed
     * @return array{quality: string, norm: float|null}
     */
    private function discrete(float $raw, array $allowed): array
    {
        if (! in_array($raw, $allowed, true)) {
            return ['quality' => 'anomalo', 'norm' => null];
        }

        return ['quality' => 'ok', 'norm' => $raw];
    }
}
