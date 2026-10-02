<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return request()->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        $emailUnique = 'unique:users,email';
        if ($userId !== null) {
            $emailUnique .= ','.$userId;
        }

        $isCreate = $this->isMethod('post');

        return [
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:120'],
            'email' => [$isCreate ? 'required' : 'sometimes', 'email', 'max:255', $emailUnique],
            'role' => [$isCreate ? 'required' : 'sometimes', 'in:admin,tecnico,agricultor'],
            'password' => [$isCreate ? 'required' : 'nullable', 'string', 'min:8', 'max:255'],
            'pin' => ['nullable', 'digits:4'],
            'farmer_id' => ['nullable', 'exists:farmers,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
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
