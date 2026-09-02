<?php
// Temporary script: assign RFID to rechiejames4@gmail.com
// Run via: php artisan eval or railway run php assign_rfid_temp.php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'rechiejames4@gmail.com')->first();
if (!$user) {
    echo "ERROR: User not found with email rechiejames4@gmail.com\n";
    exit(1);
}

$user->rfid_uid = '7523513190';
$user->save();

echo "SUCCESS: RFID '7523513190' assigned to:\n";
echo "  Name  : " . trim($user->first_name . ' ' . $user->last_name) . "\n";
echo "  Email : " . $user->email . "\n";
echo "  ID    : " . $user->id . "\n";
echo "  RFID  : " . $user->rfid_uid . "\n";
