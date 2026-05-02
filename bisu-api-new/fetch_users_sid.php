<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::with('designations.organization')->get();
foreach ($users as $u) {
    $hasSId = !empty($u->student_number) ? "HAS STUDENT ID ({$u->student_number})" : "NO STUDENT ID";
    echo $u->first_name . ' ' . $u->last_name . ' ' . $hasSId . "\n";
}
