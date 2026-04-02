<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    /**
     * Allowed origins for CORS.
     */
    private array $allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://bisu-mst.vercel.app',
    ];

    public function handle(Request $request, Closure $next)
    {
        $origin = $request->header('Origin');

        // Only add CORS headers if origin is in our whitelist
        $allowedOrigin = in_array($origin, $this->allowedOrigins) ? $origin : '';

        // Handle preflight OPTIONS requests immediately
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        // For all other requests, wrap in try-catch so errors also get CORS headers
        try {
            $response = $next($request);
        } catch (\Throwable $e) {
            // Even if the app crashes, return CORS headers so the browser shows the real error
            $response = response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }

        if ($allowedOrigin) {
            $response->header('Access-Control-Allow-Origin', $allowedOrigin);
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            $response->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}