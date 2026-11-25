<?php

namespace App\Services;

/**
 * Normaliza lecturas crudas y decide su calidad.
 * Humedad capacitiva 0-1023 con calibración, temperaturas, humedad relativa,
 * estados discretos y caudal. Los tipos reflejan la magnitud que mide cada dispositivo.
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
            'temperatura_suelo' => $this->range($raw, -55.0, 125.0),
            'aire_hr' => $this->range($raw, 0.0, 100.0),
            'lluvia' => $this->discrete($raw, [0.0, 1.0]),
            // El hardware actual es YF-S401 (hasta 6 L/min); 0 representa bomba parada.
            'caudal' => $this->range($raw, 0.0, 6.0),
            'agua_suficiente', 'bomba_estado' => $this->discrete($raw, [0.0, 1.0]),
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
