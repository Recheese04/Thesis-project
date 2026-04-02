<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$out = "";
$tables = ['member_organizations', 'attendances', 'student_clearances', 'evaluation_responses', 'users'];
foreach ($tables as $table) {
    if(!Illuminate\Support\Facades\Schema::hasTable($table)) continue;
    $out .= "=== $table ===\n";
    $keys = DB::select("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'org_attendance_system' 
          AND TABLE_NAME = ? 
          AND COLUMN_NAME = 'student_id' 
          AND REFERENCED_TABLE_NAME IS NOT NULL
    ", [$table]);
    
    $out .= "Foreign Keys on student_id:\n";
    foreach ($keys as $k) {
        $out .= "- " . $k->CONSTRAINT_NAME . "\n";
    }

    $indexes = DB::select("
        SELECT INDEX_NAME 
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = 'org_attendance_system' 
          AND TABLE_NAME = ? 
          AND COLUMN_NAME = 'student_id'
    ", [$table]);

    $out .= "Indexes on student_id:\n";
    foreach ($indexes as $i) {
        $out .= "- " . $i->INDEX_NAME . "\n";
    }
}

file_put_contents(__DIR__.'/schema_keys.txt', $out);
echo "Written to schema_keys.txt\n";
