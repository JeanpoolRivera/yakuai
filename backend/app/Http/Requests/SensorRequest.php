<?php

namespace App\Http\Requests;

use App\Models\Sensor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SensorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'tecnico'], true);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    protected function prepareForValidation(): void
    {
        foreach (["model", "pin"] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }
    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $routeSensor = $this->route('sensor');
        $existingType = $routeSensor instanceof Sensor ? $routeSensor->type : null;
        $type = $this->input('type', $existingType);
        $isHumidity = $type === 'humedad';
        $calibrationWasSent = $this->isMethod('post')
            || $this->has('type')
            || $this->has('dry_ref')
            || $this->has('wet_ref');
        $calibrationRules = $isHumidity && $calibrationWasSent
            ? ['required', 'integer', 'between:0,1023']
            : ['sometimes', 'prohibited'];

        return [
            'plot_id' => [$this->isMethod('post') ? 'required' : 'sometimes', 'integer', 'exists:plots,id'],
            'type' => [$this->isMethod('post') ? 'required' : 'sometimes', 'in:humedad,aire_temp,aire_hr,lluvia,caudal'],
            'model' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'min:1', 'max:60'],
            'pin' => ['sometimes', 'nullable', 'string', 'max:10'],
            'dry_ref' => $calibrationRules,
            'wet_ref' => $calibrationRules,
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $dry = $this->input('dry_ref');
            $wet = $this->input('wet_ref');
            if (is_numeric($dry) && is_numeric($wet) && (int) $dry === (int) $wet) {
                $validator->errors()->add('wet_ref', 'La referencia en mojado debe ser distinta de la referencia en seco.');
            }
        });
    }
}


