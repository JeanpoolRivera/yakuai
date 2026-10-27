<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'tecnico'], true);
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->input('name'))]);
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'farmer_id' => ['required', 'integer', 'exists:farmers,id'],
            'name' => ['required', 'string', 'min:2', 'max:120', 'regex:/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .\x{27}\x{2019}()#\/_-]*$/u'],
            'latitude' => ['required', 'numeric', 'decimal:0,7', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'decimal:0,7', 'between:-180,180'],
            'boundary' => ['nullable', 'array'],
            'area_m2' => ['required', 'numeric', 'decimal:0,2', 'min:1', 'max:99999999.99'],
            'area_origin' => ['sometimes', 'in:dibujo,manual'],
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'sowing_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'soil_texture_code' => ['required', 'string', 'exists:soil_textures,code'],
            'irrigation_system' => ['required', 'in:goteo,aspersion,gravedad'],
            'irrigation_efficiency' => ['required', 'numeric', 'decimal:0,2', 'min:0.01', 'lte:1'],
            'flow_lpm' => ['nullable', 'numeric', 'decimal:0,2', 'min:0.1', 'max:999999.99'],
            'status' => ['sometimes', 'in:activa,pausada,cerrada'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $boundary = $this->input('boundary');
            $areaOrigin = $this->input('area_origin', 'manual');

            if ($boundary === null || $boundary === []) {
                if ($areaOrigin === 'dibujo') {
                    $validator->errors()->add('boundary', 'Dibuja un contorno válido antes de usar el área del mapa.');
                }
                return;
            }
            if (! is_array($boundary)) {
                return;
            }

            $ring = $this->extractRing($boundary);
            if ($ring === null) {
                $validator->errors()->add('boundary', 'El contorno tiene un formato inválido. Dibuja nuevamente la parcela.');
                return;
            }

            $points = [];
            foreach ($ring as $point) {
                if (! is_array($point) || ! array_is_list($point) || count($point) !== 2) {
                    $validator->errors()->add('boundary', 'Cada vértice debe incluir longitud y latitud.');
                    return;
                }
                [$lng, $lat] = $point;
                if (! is_numeric($lng) || ! is_numeric($lat) || $lng < -180 || $lng > 180 || $lat < -90 || $lat > 90) {
                    $validator->errors()->add('boundary', 'Cada vértice debe estar dentro del rango válido de longitud y latitud.');
                    return;
                }
                $points[] = [(float) $lng, (float) $lat];
            }

            if (count($points) > 1 && $this->samePoint($points[0], $points[count($points) - 1])) {
                array_pop($points);
            }
            $unique = [];
            foreach ($points as $point) {
                $unique[sprintf('%.7F,%.7F', $point[0], $point[1])] = true;
            }
            if (count($unique) < 3) {
                $validator->errors()->add('boundary', 'El contorno debe tener al menos tres vértices diferentes.');
                return;
            }
            if ($this->hasSelfIntersection($points)) {
                $validator->errors()->add('boundary', 'El contorno se cruza consigo mismo. Ajusta sus vértices.');
                return;
            }

            $calculatedArea = $this->ringAreaM2($points);
            if ($calculatedArea <= 0) {
                $validator->errors()->add('boundary', 'El contorno debe encerrar un área mayor que cero.');
                return;
            }
            if ($areaOrigin === 'dibujo' && is_numeric($this->input('area_m2'))) {
                $area = (float) $this->input('area_m2');
                if ($area > 0 && abs($calculatedArea - $area) / $calculatedArea > 0.10) {
                    $validator->errors()->add('area_m2', 'El área difiere más de 10 % del contorno. Confirma o vuelve a dibujarlo.');
                }
            }
        });
    }

    /** @param array<int, mixed> $boundary @return array<int, mixed>|null */
    private function extractRing(array $boundary): ?array
    {
        $first = $boundary[0] ?? null;
        if (! is_array($first)) {
            return null;
        }
        if (isset($first[0]) && is_numeric($first[0])) {
            return $boundary;
        }
        if (count($boundary) !== 1) {
            return null;
        }
        return $first;
    }

    /** @param array{float,float} $a @param array{float,float} $b */
    private function samePoint(array $a, array $b): bool
    {
        return abs($a[0] - $b[0]) < 1.0e-10 && abs($a[1] - $b[1]) < 1.0e-10;
    }

    /** @param list<array{float,float}> $points */
    private function hasSelfIntersection(array $points): bool
    {
        $count = count($points);
        for ($i = 0; $i < $count; $i++) {
            $a1 = $points[$i];
            $a2 = $points[($i + 1) % $count];
            for ($j = $i + 1; $j < $count; $j++) {
                if ($j === $i || $j === ($i + 1) % $count || ($j + 1) % $count === $i) {
                    continue;
                }
                if ($this->segmentsIntersect($a1, $a2, $points[$j], $points[($j + 1) % $count])) {
                    return true;
                }
            }
        }
        return false;
    }

    /** @param array{float,float} $a @param array{float,float} $b @param array{float,float} $c @param array{float,float} $d */
    private function segmentsIntersect(array $a, array $b, array $c, array $d): bool
    {
        $orient = static fn (array $p, array $q, array $r): float => ($q[0] - $p[0]) * ($r[1] - $p[1]) - ($q[1] - $p[1]) * ($r[0] - $p[0]);
        $onSegment = static fn (array $p, array $q, array $r): bool => $q[0] >= min($p[0], $r[0]) - 1.0e-10 && $q[0] <= max($p[0], $r[0]) + 1.0e-10 && $q[1] >= min($p[1], $r[1]) - 1.0e-10 && $q[1] <= max($p[1], $r[1]) + 1.0e-10;
        $o1 = $orient($a, $b, $c);
        $o2 = $orient($a, $b, $d);
        $o3 = $orient($c, $d, $a);
        $o4 = $orient($c, $d, $b);
        if ((($o1 > 0 && $o2 < 0) || ($o1 < 0 && $o2 > 0)) && (($o3 > 0 && $o4 < 0) || ($o3 < 0 && $o4 > 0))) {
            return true;
        }
        return (abs($o1) < 1.0e-10 && $onSegment($a, $c, $b))
            || (abs($o2) < 1.0e-10 && $onSegment($a, $d, $b))
            || (abs($o3) < 1.0e-10 && $onSegment($c, $a, $d))
            || (abs($o4) < 1.0e-10 && $onSegment($c, $b, $d));
    }

    /** @param list<array{float,float}> $ring */
    private function ringAreaM2(array $ring): float
    {
        $count = count($ring);
        if ($count < 3) {
            return 0.0;
        }
        $latitude = array_sum(array_column($ring, 1)) / $count;
        $radius = 6371000;
        $cosine = cos(deg2rad($latitude));
        $points = array_map(static fn (array $point): array => [
            $point[0] * M_PI * $radius * $cosine / 180,
            $point[1] * M_PI * $radius / 180,
        ], $ring);
        $sum = 0.0;
        for ($i = 0; $i < $count; $i++) {
            [$x1, $y1] = $points[$i];
            [$x2, $y2] = $points[($i + 1) % $count];
            $sum += $x1 * $y2 - $x2 * $y1;
        }
        return abs($sum / 2);
    }
}



