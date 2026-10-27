<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Validates the same common email syntax accepted by the frontend. */
class EmailAddress implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('Escribe un correo válido.');
            return;
        }

        $pattern = <<<'REGEX'
/^(?=.{3,254}$)[A-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/iD
REGEX;
        $at = strrpos($value, '@');
        $domain = $at === false ? '' : substr($value, $at + 1);

        if ($at === false || $at < 1 || $at > 64 || strlen($domain) > 253 || preg_match($pattern, $value) !== 1) {
            $fail('Escribe un correo válido.');
        }
    }
}
