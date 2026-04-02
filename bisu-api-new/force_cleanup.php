<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;

$cols = ['student_number', 'first_name', 'middle_name', 'last_name', 'course', 'year_level', 'contact_number', 'department_id', 'rfid_uid', 'profile_picture'];

foreach ($cols as $col) {
    try {
        DB::statement("ALTER TABLE users DROP COLUMN $col");
        echo "Dropped $col\n";
    } catch (\Exception $e) {
        echo "Could not drop $col or already gone\n";
    }
}

DB::table('migrations')->where('migration', '2026_03_31_000001_merge_students_into_users')->delete();
echo "Done\n";
