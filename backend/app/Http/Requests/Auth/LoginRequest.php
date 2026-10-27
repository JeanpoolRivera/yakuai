<?php

namespace App\Http\Requests\Auth;

use App\Rules\EmailAddress;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', new EmailAddress, 'max:254'],
            'secret' => ['required', 'string', 'max:255'],
        ];
    }
}

