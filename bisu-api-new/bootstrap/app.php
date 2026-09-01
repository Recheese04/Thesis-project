<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // CORS is handled by Apache .htaccess — no PHP middleware needed

        // ✅ FIX: Return JSON 401 for auth routes instead of crashing with "Route [login] not defined"
        $middleware->redirectGuestsTo(function (\Illuminate\Http\Request $request) {
            if ($request->is('api/attendance/rfid-device') || $request->is('attendance/rfid-device')) {
                return null;
            }
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();