<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MeasurementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (in_array($user->role, ['admin', 'tecnico'], true)) {
            return true;
        }

        return $user->currentAccessToken()?->can('ingerir') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sensor_id' => ['required', 'exists:sensors,id'],
            'measured_at' => ['required', 'date', 'before_or_equal:now'],
            'raw_value' => ['required', 'numeric'],
            'origin' => ['sometimes', 'in:manual,sensor,demo'],
        ];
    }
}
