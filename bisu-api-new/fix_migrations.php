<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach(glob('database/migrations/*.php') as $file) {
    $name = basename($file, '.php');
    if (!str_starts_with($name, '2026_04_01') && !Illuminate\Support\Facades\DB::table('migrations')->where('migration', $name)->exists()) {
        Illuminate\Support\Facades\DB::table('migrations')->insert(['migration' => $name, 'batch' => 99]);
        echo "Inserted " . $name . PHP_EOL;
    }
}
echo "Done\n";
