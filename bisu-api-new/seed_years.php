<?php
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

for ($i = 2020; $i <= 2030; $i++) {
    $name = $i . '-' . ($i + 1);
    \App\Models\SchoolYear::firstOrCreate(['name' => $name]);
}

\App\Models\SchoolYear::where('is_active', true)->update(['is_active' => false]);
\App\Models\SchoolYear::where('name', '2025-2026')->update(['is_active' => true]);

echo "Done seeding years.\n";
