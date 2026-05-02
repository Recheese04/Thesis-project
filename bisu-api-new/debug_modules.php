<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'christiandave.ayag@bisu.edu.ph')->first();
$orgIds = App\Models\Designation::where('user_id', $user->id)
    ->where('status', 'active')
    ->pluck('organization_id')
    ->toArray();

echo "Mabini Org ID: " . implode(',', $orgIds) . "\n";

$activeYear = App\Models\SchoolYear::where('is_active', true)->first();
echo "Active School Year ID: " . ($activeYear ? $activeYear->id : 'NONE') . "\n";

$events = App\Models\Event::whereIn('organization_id', $orgIds)->get();
echo "\nTotal events for org: " . $events->count() . "\n";
foreach($events as $e) {
    echo "  - Event: {$e->title} | SY: {$e->school_year_id} | Status: {$e->status}\n";
}

$activeYearEvents = App\Models\Event::whereIn('organization_id', $orgIds)
    ->where('school_year_id', $activeYear->id)
    ->get();
echo "\nTotal events for org in active SY: " . $activeYearEvents->count() . "\n";

$announcements = App\Models\Announcement::whereIn('organization_id', $orgIds)->get();
echo "\nTotal announcements for org: " . $announcements->count() . "\n";

$obligations = App\Models\Obligation::where('user_id', $user->id)->get();
echo "\nTotal obligations for user: " . $obligations->count() . "\n";
