<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename departments → colleges
        Schema::rename('departments', 'colleges');

        // 2. Rename users.department_id → users.college_id
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('department_id', 'college_id');
        });

        // 3. Rename organizations.department_id → organizations.college_id
        Schema::table('organizations', function (Blueprint $table) {
            $table->renameColumn('department_id', 'college_id');
        });

        // 4. Create courses table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('college_id');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->timestamps();

            $table->foreign('college_id')->references('id')->on('colleges')->onDelete('cascade');
        });

        // 5. Seed courses from existing user.course strings
        $existingCourses = DB::table('users')
            ->whereNotNull('course')
            ->where('course', '!=', '')
            ->select('course', 'college_id')
            ->distinct()
            ->get();

        foreach ($existingCourses as $row) {
            if (!$row->college_id) continue;

            $exists = DB::table('courses')
                ->where('name', $row->course)
                ->where('college_id', $row->college_id)
                ->exists();

            if (!$exists) {
                DB::table('courses')->insert([
                    'college_id'  => $row->college_id,
                    'name'        => $row->course,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        // 6. Add course_id FK to users, populate it, then drop old course string
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('course_id')->nullable()->after('college_id');
        });

        // Populate course_id from existing course strings
        $users = DB::table('users')
            ->whereNotNull('course')
            ->where('course', '!=', '')
            ->get(['id', 'course', 'college_id']);

        foreach ($users as $user) {
            $courseRecord = DB::table('courses')
                ->where('name', $user->course)
                ->where('college_id', $user->college_id)
                ->first();

            if ($courseRecord) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['course_id' => $courseRecord->id]);
            }
        }

        // Drop old course string column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('course');
        });
    }

    public function down(): void
    {
        // Re-add course string column
        Schema::table('users', function (Blueprint $table) {
            $table->string('course')->nullable()->after('college_id');
        });

        // Populate course string from course_id
        $users = DB::table('users')
            ->whereNotNull('course_id')
            ->get(['id', 'course_id']);

        foreach ($users as $user) {
            $course = DB::table('courses')->find($user->course_id);
            if ($course) {
                DB::table('users')->where('id', $user->id)->update(['course' => $course->name]);
            }
        }

        // Drop course_id
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });

        // Drop courses table
        Schema::dropIfExists('courses');

        // Rename back
        Schema::table('organizations', function (Blueprint $table) {
            $table->renameColumn('college_id', 'department_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('college_id', 'department_id');
        });

        Schema::rename('colleges', 'departments');
    }
};
