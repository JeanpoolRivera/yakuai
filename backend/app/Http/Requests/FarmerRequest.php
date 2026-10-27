<?php

namespace App\Http\Requests;

use App\Rules\EmailAddress;

use App\Models\Farmer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FarmerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'tecnico'], true);
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

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $farmer = $this->route('farmer');
        $account = $farmer instanceof Farmer ? $farmer->accessAccount()->first() : null;

        $uniqueEmail = Rule::unique('users', 'email');
        if ($account !== null) {
            $uniqueEmail->ignore($account->id);
        }

        $uniquePendingInvitation = Rule::unique('farmer_invitations', 'email')
            ->where(fn ($query) => $query->whereNull('accepted_at')->where('expires_at', '>', now()));
        $ownPendingInvitation = $account?->invitations()
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();
        if ($ownPendingInvitation !== null) {
            $uniquePendingInvitation->ignore($ownPendingInvitation->id);
        }

        return [
            'name' => ['required', 'string', 'min:2', 'max:120', 'regex:/^[\p{L}\p{M}]+(?:[ \'\x{2019}-][\p{L}\p{M}]+)*$/u'],
            'phone' => ['nullable', 'string', 'regex:/^\d{9}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'email' => ['sometimes', 'nullable', 'string', new EmailAddress, 'max:254', $uniqueEmail, $uniquePendingInvitation],
        ];
    }
}
