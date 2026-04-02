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
        // Prepend our custom CORS middleware so it runs FIRST and catches ALL responses (including crashes)
        $middleware->prepend(\App\Http\Middleware\Cors::class);

        // ✅ FIX: Return JSON 401 instead of crashing with "Route [login] not defined"
        $middleware->redirectGuestsTo(fn() => response()->json(['message' => 'Unauthenticated.'], 401));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();