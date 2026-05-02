<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::with('designations.organization')->get();
foreach ($users as $u) {
    echo $u->first_name . ' ' . $u->last_name . ' (' . $u->email . ') -> ' . $u->designations->count() . " active orgs\n";
    foreach ($u->designations as $d) {
        echo "   - " . $d->organization->name . " [" . $d->status . "]\n";
    }
}
