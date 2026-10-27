<?php

namespace App\Http\Requests;

use App\Models\Sensor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MeasurementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (in_array($user->role, ['admin', 'tecnico'], true)) {
            return true;
        }
        return $user->currentAccessToken()?->can('ingerir') ?? false;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'sensor_id' => ['required', 'integer', 'exists:sensors,id'],
            'measured_at' => ['required', 'date_format:Y-m-d\\TH:i:s', 'before_or_equal:now'],
            'raw_value' => ['required', 'numeric', 'decimal:0,2'],
            'origin' => ['sometimes', 'in:manual,sensor,demo'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            // Las lecturas manuales deben estar dentro del rango físico. Las del dispositivo
            // conservan la clasificación de anomalías que aplica SensorNormalizer.
            if ($this->input('origin', 'manual') !== 'manual'
                || $validator->errors()->has('sensor_id')
                || $validator->errors()->has('raw_value')) {
                return;
            }

            $sensor = Sensor::find($this->input('sensor_id'));
            $raw = $this->input('raw_value');
            if ($sensor === null || ! is_numeric($raw)) {
                return;
            }
            $value = (float) $raw;
            $valid = match ($sensor->type) {
                'humedad' => $value >= 0 && $value <= 1023 && floor($value) === $value,
                'aire_temp' => $value >= -10 && $value <= 60,
                'aire_hr' => $value >= 0 && $value <= 100,
                'lluvia' => $value === 0.0 || $value === 1.0,
                'caudal' => $value >= 0 && $value <= 60,
                default => false,
            };
            if (! $valid) {
                $validator->errors()->add('raw_value', 'La lectura no corresponde al rango del sensor seleccionado.');
            }
        });
    }
}
