<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestCorrelation
{
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Request-ID') ?? uniqid('req_', true);

        $request->headers->set('X-Request-ID', $correlationId);

        Log::shareContext([
            'correlation_id' => $correlationId,
            'method' => $request->method(),
            'path' => $request->path(),
        ]);

        $response = $next($request);

        $response->headers->set('X-Request-ID', $correlationId);

        return $response;
    }
}
