<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    /**
     * Handle an incoming request and enforce the declared scope of personal access tokens.
     * Browser sessions and full-access staff tokens retain their existing behavior.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null || $user->is_active === false) {
            return response()->json([
                'error' => ['message' => 'No autenticado o cuenta inactiva.'],
            ], 401);
        }

        if ($roles !== [] && ! in_array($user->role, $roles, true)) {
            return response()->json([
                'error' => ['message' => 'Sin permiso para esta acción.'],
            ], 403);
        }

        $token = $user->currentAccessToken();
        if ($request->bearerToken() !== null && $token instanceof PersonalAccessToken && ! $token->can('*')) {
            $requiredAbility = $this->requiredAbility($request);
            if (! $token->can($requiredAbility)) {
                return response()->json([
                    'error' => ['message' => 'El token no tiene permiso para esta acción.'],
                ], 403);
            }
        }

        return $next($request);
    }

    private function requiredAbility(Request $request): string
    {
        if ($request->isMethodSafe()) {
            return 'ver';
        }

        $uri = ltrim($request->route()?->uri() ?? '', '/');

        if ($uri === 'api/v1/measurements') {
            return 'ingerir';
        }

        if (preg_match('#^api/v1/plots/[^/]+/(evaluate|weather/refresh)$#', $uri)) {
            return 'evaluar';
        }

        if ($uri === 'api/v1/irrigations') {
            return 'regar';
        }

        if (in_array($uri, ['api/v1/auth/logout', 'api/v1/auth/refresh'], true)) {
            return 'ver';
        }

        return 'administrar';
    }
}
