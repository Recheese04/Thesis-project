<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

// If the users columns exist, drop them
if (Schema::hasColumn('users', 'student_number')) {
    Schema::table('users', function(Blueprint $table) {
        $table->dropColumn([
            'student_number', 'first_name', 'middle_name', 'last_name',
            'course', 'year_level', 'contact_number', 'department_id',
            'rfid_uid', 'profile_picture'
        ]);
    });
    echo "Dropped user columns.\n";
} else {
    echo "User columns already dropped.\n";
}

// Check member_organizations user_id
if (Schema::hasColumn('member_organizations', 'user_id')) {
    DB::statement('ALTER TABLE member_organizations DROP COLUMN user_id');
    echo "Dropped member_organizations user_id.\n";
} else {
    echo "member_organizations user_id already dropped.\n";
}

// Check attendances user_id
if (Schema::hasColumn('attendances', 'user_id')) {
    DB::statement('ALTER TABLE attendances DROP COLUMN user_id');
    echo "Dropped attendances user_id.\n";
} else {
    echo "attendances user_id already dropped.\n";
}

// Check student_clearances user_id
if (Schema::hasColumn('student_clearances', 'user_id')) {
    DB::statement('ALTER TABLE student_clearances DROP COLUMN user_id');
    echo "Dropped student_clearances user_id.\n";
} else {
    echo "student_clearances user_id already dropped.\n";
}

// Check evaluation_responses user_id
if (Schema::hasColumn('evaluation_responses', 'user_id')) {
    DB::statement('ALTER TABLE evaluation_responses DROP COLUMN user_id');
    echo "Dropped evaluation_responses user_id.\n";
} else {
    echo "evaluation_responses user_id already dropped.\n";
}

DB::table('migrations')->where('migration', '2026_03_31_000001_merge_students_into_users')->delete();
echo "Removed migration record.\n";
