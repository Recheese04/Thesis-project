<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'christiandave.ayag@bisu.edu.ph')->first();
if (!$user) { echo "USER NOT FOUND\n"; exit; }

echo "User: {$user->first_name} {$user->last_name}\n";
echo "Email: {$user->email}\n";
echo "Student Number: " . ($user->student_number ?: 'NONE') . "\n";
echo "user_type_id: {$user->user_type_id}\n\n";

$designations = App\Models\Designation::with('organization')
    ->where('user_id', $user->id)
    ->get();

echo "ALL designations (any status):\n";
foreach ($designations as $d) {
    echo "  - Org: {$d->organization->name} | Designation: {$d->designation} | Status: {$d->status}\n";
}

echo "\nACTIVE designations only:\n";
$active = $designations->where('status', 'active');
foreach ($active as $d) {
    echo "  - Org: {$d->organization->name} | Designation: {$d->designation}\n";
}

// Simulate resolveRole
$role = 'student';
$membership = App\Models\Designation::with('organization')
    ->where('user_id', $user->id)
    ->where('status', 'active')
    ->orderByRaw("CASE WHEN designation = 'Member' THEN 1 ELSE 0 END ASC")
    ->first();

if ($membership) {
    if ($membership->designation !== 'Member') {
        $role = 'officer';
    }
}

echo "\nResolved role: {$role}\n";
echo "Primary membership: " . ($membership ? "{$membership->organization->name} as {$membership->designation}" : "NONE") . "\n";

// Simulate /profile/my-organizations
echo "\n/profile/my-organizations would return:\n";
if (!$user->student_number) {
    echo "  EMPTY (no student_number)\n";
} else {
    $orgs = App\Models\Designation::with('organization')
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->get();
    foreach ($orgs as $o) {
        echo "  - {$o->organization->name} ({$o->designation})\n";
    }
    if ($orgs->isEmpty()) echo "  EMPTY (no active designations)\n";
}
