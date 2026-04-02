<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // Drop from users table
        if (Schema::hasColumn('users', 'student_id')) {
            try { DB::statement("ALTER TABLE users DROP FOREIGN KEY fk_users_student"); } catch (\Exception $e) {}
            try { DB::statement("ALTER TABLE users DROP INDEX fk_users_student"); } catch (\Exception $e) {}
            try { DB::statement("ALTER TABLE users DROP COLUMN student_id"); } catch (\Exception $e) {}
        }

        // Drop from evaluation_responses table
        if (Schema::hasColumn('evaluation_responses', 'student_id')) {
            try { DB::statement("ALTER TABLE evaluation_responses DROP FOREIGN KEY evaluation_responses_ibfk_2"); } catch (\Exception $e) {}
            try { DB::statement("ALTER TABLE evaluation_responses DROP INDEX unique_student_evaluation"); } catch (\Exception $e) {}
            try { DB::statement("ALTER TABLE evaluation_responses DROP COLUMN student_id"); } catch (\Exception $e) {}
        }

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse intentionally to keep database clean
    }
};
