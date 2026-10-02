<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    /**
     * Handle an incoming request.
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

        if ($token !== null && ! $token->can('*') && $token->can('ingerir')
            && $request->route()?->getName() !== 'measurements.store'
        ) {
            return response()->json([
                'error' => ['message' => 'Token solo autorizado para ingesta.'],
            ], 403);
        }

        return $next($request);
    }
}
