<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            $table->unsignedInteger('owner_id')->nullable()->after('faq_category_id');
            $table->foreign('owner_id')->references('owner_id')->on('dog_owners')->nullOnDelete();
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->text('background')->nullable()->after('specialization');
            $table->unsignedSmallInteger('experience_years')->nullable()->after('background');
            $table->text('qualifications')->nullable()->after('experience_years');
        });

        DB::table('staff')->where('role', 'front_desk')->update(['role' => 'admin']);

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE staff MODIFY role ENUM('veterinarian', 'admin', 'groomer') NOT NULL");
        }
    }

    public function down(): void
    {
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE staff MODIFY role ENUM('veterinarian', 'admin', 'front_desk', 'groomer') NOT NULL");
        }

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn(['background', 'experience_years', 'qualifications']);
        });

        Schema::table('faqs', function (Blueprint $table) {
            $table->dropForeign(['owner_id']);
            $table->dropColumn('owner_id');
        });
    }
};
