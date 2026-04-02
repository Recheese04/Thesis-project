<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add student columns to users ─────────────────────────────────
        if (!Schema::hasColumn('users', 'student_number')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('student_number', 50)->nullable()->unique()->after('id');
                $table->string('first_name', 100)->nullable()->after('student_number');
                $table->string('middle_name', 100)->nullable()->after('first_name');
                $table->string('last_name', 100)->nullable()->after('middle_name');
                $table->string('course', 255)->nullable()->after('last_name');
                $table->string('year_level', 20)->nullable()->after('course');
                $table->string('contact_number', 20)->nullable()->after('year_level');
                $table->unsignedBigInteger('department_id')->nullable()->after('contact_number');
                $table->string('rfid_uid', 50)->nullable()->unique()->after('department_id');
                $table->string('profile_picture')->nullable()->after('rfid_uid');
            });
            
            DB::statement("
                UPDATE users u
                INNER JOIN students s ON u.student_id = s.id
                SET u.student_number  = s.student_number,
                    u.first_name      = s.first_name,
                    u.middle_name     = s.middle_name,
                    u.last_name       = s.last_name,
                    u.course          = s.course,
                    u.year_level      = s.year_level,
                    u.contact_number  = s.contact_number,
                    u.department_id   = s.department_id,
                    u.rfid_uid        = s.rfid_uid,
                    u.profile_picture = s.profile_picture
            ");
        }

        // ── 3. Repoint member_organizations.student_id → user_id ────────────
        if (!Schema::hasColumn('member_organizations', 'user_id')) {
            Schema::table('member_organizations', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            });
            DB::statement("
                UPDATE member_organizations mo
                INNER JOIN users u ON u.student_id = mo.student_id
                SET mo.user_id = u.id
            ");
        }
        if (Schema::hasColumn('member_organizations', 'student_id')) {
            try { DB::statement("ALTER TABLE member_organizations ADD UNIQUE INDEX member_org_user_unique (organization_id, user_id)"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE member_organizations DROP FOREIGN KEY member_organizations_ibfk_2"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE member_organizations DROP INDEX unique_member_org"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE member_organizations DROP INDEX student_id"); } catch(\Exception $e){}
            Schema::table('member_organizations', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }

        // ── 4. Repoint attendances.student_id → user_id ─────────────────────
        if (!Schema::hasColumn('attendances', 'user_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('event_id');
            });
            DB::statement("
                UPDATE attendances a
                INNER JOIN users u ON u.student_id = a.student_id
                SET a.user_id = u.id
            ");
        }
        if (Schema::hasColumn('attendances', 'student_id')) {
            try { DB::statement("ALTER TABLE attendances ADD UNIQUE INDEX attendance_event_user_unique (event_id, user_id)"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE attendances DROP FOREIGN KEY attendances_ibfk_2"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE attendances DROP INDEX unique_attendance"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE attendances DROP INDEX student_id"); } catch(\Exception $e){}
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }

        // ── 5. Repoint student_clearances.student_id → user_id ──────────────
        if (Schema::hasTable('student_clearances')) {
            if (!Schema::hasColumn('student_clearances', 'user_id')) {
                Schema::table('student_clearances', function (Blueprint $table) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('id');
                });
                DB::statement("
                    UPDATE student_clearances sc
                    INNER JOIN users u ON u.student_id = sc.student_id
                    SET sc.user_id = u.id
                ");
            }
            if (Schema::hasColumn('student_clearances', 'student_id')) {
                try { DB::statement("ALTER TABLE student_clearances ADD UNIQUE INDEX clearance_user_req_unique (user_id, requirement_id)"); } catch(\Exception $e){}
                try { DB::statement("ALTER TABLE student_clearances DROP FOREIGN KEY student_clearance_student_fk"); } catch(\Exception $e){}
                try { DB::statement("ALTER TABLE student_clearances DROP INDEX unique_student_requirement"); } catch(\Exception $e){}
                Schema::table('student_clearances', function (Blueprint $table) {
                    $table->dropColumn('student_id');
                });
            }
        }

        // ── 6. Repoint evaluation_responses.student_id → user_id ────────────
        if (!Schema::hasColumn('evaluation_responses', 'user_id')) {
            Schema::table('evaluation_responses', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('evaluation_id');
            });
            DB::statement("
                UPDATE evaluation_responses er
                INNER JOIN users u ON u.student_id = er.student_id
                SET er.user_id = u.id
            ");
        }
        if (Schema::hasColumn('evaluation_responses', 'student_id')) {
            try { DB::statement("ALTER TABLE evaluation_responses ADD UNIQUE INDEX eval_response_user_unique (evaluation_id, user_id)"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE evaluation_responses DROP FOREIGN KEY evaluation_responses_ibfk_2"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE evaluation_responses DROP INDEX unique_student_evaluation"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE evaluation_responses DROP INDEX student_id"); } catch(\Exception $e){}
            Schema::table('evaluation_responses', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }

        // ── 7. Drop the students table ──────────────────────────────────────
        if (Schema::hasColumn('users', 'student_id')) {
            try { DB::statement("ALTER TABLE users DROP FOREIGN KEY fk_users_student"); } catch(\Exception $e){}
            try { DB::statement("ALTER TABLE users DROP INDEX fk_users_student"); } catch(\Exception $e){}
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('student_id');
            });
        }
        Schema::dropIfExists('students');

        // ── 8. Clean up redundant string columns ────────────────────────────
        if (Schema::hasTable('clearance_requirements')) {
            if (Schema::hasColumn('clearance_requirements', 'school_year')) {
                Schema::table('clearance_requirements', function (Blueprint $table) {
                    $table->dropColumn('school_year');
                });
            }
        }
        if (Schema::hasTable('student_clearances')) {
            if (Schema::hasColumn('student_clearances', 'school_year')) {
                Schema::table('student_clearances', function (Blueprint $table) {
                    $table->dropColumn('school_year');
                });
            }
            if (Schema::hasColumn('student_clearances', 'semester')) {
                Schema::table('student_clearances', function (Blueprint $table) {
                    $table->dropColumn('semester');
                });
            }
        }

        // ── 9. Rename user_type 'Member' → 'Student' ───────────────────────
        DB::table('user_types')->where('name', 'Member')->update(['name' => 'Student']);
    }

    public function down(): void
    {
        // This migration is not reversible without data loss.
        // Restore from backup if needed.
    }
};
