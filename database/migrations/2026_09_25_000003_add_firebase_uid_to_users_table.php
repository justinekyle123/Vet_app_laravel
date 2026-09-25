<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // The Firebase user ID (the ID token's "sub" claim), e.g. "kY8fZh...".
            $table->string('firebase_uid')->nullable()->unique()->after('id');
        });

        /*
         * Retire the previous provider's identifier. Deliberately a new
         * migration rather than an edit to the Clerk one: that migration has
         * already run in deployed environments, and rewriting it would break
         * their rollback path. Guarded so an installation created after Clerk
         * was dropped still migrates cleanly.
         */
        if (Schema::hasColumn('users', 'clerk_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['clerk_id']);
                $table->dropColumn('clerk_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'clerk_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('clerk_id')->nullable()->unique()->after('id');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['firebase_uid']);
            $table->dropColumn('firebase_uid');
        });
    }
};
