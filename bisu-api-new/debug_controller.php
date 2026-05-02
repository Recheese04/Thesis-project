<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'christiandave.ayag@bisu.edu.ph')->first();
auth()->login($user);

$request = Illuminate\Http\Request::create('/api/events', 'GET', ['role' => 'student']);
$request->setUserResolver(fn() => $user);

$controller = app()->make(App\Http\Controllers\Api\EventController::class);
$response = $controller->index($request);

echo "Events returned status: " . $response->status() . "\n";
echo "Events payload sample:\n";
echo substr(json_encode($response->getData()), 0, 500) . "...\n";
