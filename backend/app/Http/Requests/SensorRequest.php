<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SensorRequest extends FormRequest
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
            'plot_id' => ['required', 'exists:plots,id'],
            'type' => ['required', 'in:humedad,aire_temp,aire_hr,lluvia,caudal'],
            'model' => ['sometimes', 'string', 'max:60'],
            'pin' => ['nullable', 'string', 'max:10'],
            'dry_ref' => ['required_if:type,humedad', 'nullable', 'integer', 'between:0,1023'],
            'wet_ref' => ['required_if:type,humedad', 'nullable', 'integer', 'between:0,1023'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
