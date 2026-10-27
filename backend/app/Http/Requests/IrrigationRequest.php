<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IrrigationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $isCorrectionOrAnnulment = $this->is('*/corregir') || $this->is('*/anular');
        if ($isCorrectionOrAnnulment) {
            return in_array($user->role, ['admin', 'tecnico'], true);
        }
        return in_array($user->role, ['admin', 'tecnico'], true) || $user->tokenCan('regar');
    }

    protected function prepareForValidation(): void
    {
        foreach (['note', 'motivo'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $liters = ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:99999999.99'];
        $reason = ['required', 'string', 'max:255'];

        if ($this->is('*/anular')) {
            return ['motivo' => $reason];
        }
        if ($this->is('*/corregir')) {
            return ['applied_liters' => $liters, 'motivo' => $reason];
        }

        return [
            'plot_id' => ['required', 'integer', 'exists:plots,id'],
            'evaluation_id' => ['nullable', 'integer', 'exists:evaluations,id'],
            'occurred_at' => ['required', 'date_format:Y-m-d\\TH:i:s', 'before_or_equal:now'],
            'recommended_liters' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'applied_liters' => $liters,
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}

