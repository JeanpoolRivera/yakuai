<?php

namespace App\Http\Requests;

use App\Rules\EmailAddress;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return request()->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];
        if (is_string($this->input('name'))) {
            $normalized['name'] = trim($this->input('name'));
        }
        if (is_string($this->input('email'))) {
            $normalized['email'] = strtolower(trim($this->input('email')));
        }
        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        $emailUnique = 'unique:users,email'.($userId !== null ? ','.$userId : '');
        $isCreate = $this->isMethod('post');

        return [
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'min:2', 'max:120', 'regex:/^[\p{L}\p{M}]+(?:[ \'\x{2019}-][\p{L}\p{M}]+)*$/u'],
            'email' => [$isCreate ? 'required' : 'sometimes', 'string', new EmailAddress, 'max:254', $emailUnique],
            'role' => [$isCreate ? 'required' : 'sometimes', 'in:admin,tecnico,agricultor'],
            'password' => [$isCreate ? 'required' : 'nullable', 'string', 'min:8', 'max:255'],
            'pin' => ['nullable', 'string', 'regex:/^\d{4}$/'],
            'farmer_id' => ['nullable', 'integer', 'exists:farmers,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, mixed> */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (is_array($data) && array_key_exists('pin', $data)) {
            $data['pin_code'] = $data['pin'];
            unset($data['pin']);
        }

        return $data;
    }
}



