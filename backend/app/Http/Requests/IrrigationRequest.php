<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IrrigationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! in_array($user->role, ['admin', 'tecnico'], true)) {
            return $user->tokenCan('regar');
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->is('*/anular')) {
            return ['motivo' => ['required', 'string', 'max:255']];
        }

        if ($this->is('*/corregir')) {
            return [
                'applied_liters' => ['required', 'numeric', 'min:0'],
                'motivo' => ['required', 'string', 'max:255'],
            ];
        }

        return [
            'plot_id' => ['required', 'exists:plots,id'],
            'evaluation_id' => ['nullable', 'exists:evaluations,id'],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],
            'recommended_liters' => ['nullable', 'numeric', 'min:0'],
            'applied_liters' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
