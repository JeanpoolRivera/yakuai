<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PlotRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'tecnico'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'farmer_id' => ['required', 'exists:farmers,id'],
            'name' => ['required', 'string', 'max:120'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'boundary' => ['nullable', 'array'],
            'area_m2' => ['required', 'numeric', 'min:1'],
            'area_origin' => ['sometimes', 'in:dibujo,manual'],
            'crop_id' => ['required', 'exists:crops,id'],
            'sowing_date' => ['required', 'date', 'before_or_equal:today'],
            'soil_texture_code' => ['required', 'exists:soil_textures,code'],
            'irrigation_system' => ['required', 'in:goteo,aspersion,gravedad'],
            'irrigation_efficiency' => ['required', 'numeric', 'gt:0', 'lte:1'],
            'flow_lpm' => ['nullable', 'numeric', 'gt:0'],
            'status' => ['sometimes', 'in:activa,pausada,cerrada'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $boundary = $this->input('boundary');
            $area = (float) $this->input('area_m2', 0);

            if (! is_array($boundary) || $boundary === []) {
                return;
            }

            $ring = $this->extractRing($boundary);
            if ($ring === null) {
                $validator->errors()->add('boundary', 'Contorno inválido. Debe ser anillo [longitud, latitud] o [[anillo]].');

                return;
            }

            if (count($ring) < 3) {
                return;
            }

            foreach ($ring as $point) {
                if (! is_array($point) || count($point) !== 2) {
                    $validator->errors()->add('boundary', 'Cada punto debe ser [longitud, latitud].');

                    return;
                }
                [$lng, $lat] = array_values($point);
                if (! is_numeric($lng) || $lng < -180 || $lng > 180 || ! is_numeric($lat) || $lat < -90 || $lat > 90) {
                    $validator->errors()->add('boundary', 'Punto fuera de rango válido.');

                    return;
                }
            }

            $calc = $this->ringAreaM2($ring);
            if ($calc <= 0 || $area <= 0) {
                return;
            }

            if (abs($calc - $area) / $calc > 0.10 && $this->input('area_origin', 'manual') === 'dibujo') {
                $validator->errors()->add('area_m2', 'El área no coincide con el dibujo (tolerancia 10%). Confirma el contorno.');
            }
        });
    }

    /**
     * @param  array<int, mixed>  $boundary
     * @return array<int, mixed>|null
     */
    private function extractRing(array $boundary): ?array
    {
        if ($boundary === []) {
            return null;
        }

        $first = $boundary[0] ?? null;
        if (! is_array($first)) {
            return null;
        }

        // Forma plana [[lng,lat],...] (tests y carga simple).
        if (isset($first[0]) && is_numeric($first[0])) {
            return $boundary;
        }

        // Forma con anillo exterior [[[lng,lat],...]] (mapa frontend).
        if (count($boundary) > 1) {
            return null;
        }

        return is_array($first) ? $first : null;
    }

    /**
     * @param  array<int, mixed>  $ring
     */
    private function ringAreaM2(array $ring): float
    {
        $pts = array_values(array_filter($ring, fn ($p) => is_array($p) && count($p) === 2));
        $n = count($pts);
        if ($n < 3) {
            return 0.0;
        }

        $lats = array_map(fn ($p) => (float) array_values($p)[1], $pts);
        $lat0 = array_sum($lats) / $n;
        $cos = cos(deg2rad($lat0));
        $r = 6371000;

        $xy = array_map(fn ($p) => [(float) array_values($p)[0] * M_PI * $r * $cos / 180, (float) array_values($p)[1] * M_PI * $r / 180], $pts);

        $sum = 0.0;
        for ($i = 0; $i < $n; $i++) {
            [$x1, $y1] = $xy[$i];
            [$x2, $y2] = $xy[($i + 1) % $n];
            $sum += $x1 * $y2 - $x2 * $y1;
        }

        return abs($sum / 2);
    }
}
