<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->is('*/auth/pin')) {
            return [
                'email' => ['required', 'email'],
                'pin' => ['required', 'digits:4'],
            ];
        }

        return [
            'email' => ['required', 'email'],
            'secret' => ['required', 'string'],
        ];
    }
}
