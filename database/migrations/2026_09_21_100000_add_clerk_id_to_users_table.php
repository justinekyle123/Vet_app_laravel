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
            // The Clerk user ID ("sub" claim), e.g. "user_2abc...".
            $table->string('clerk_id')->nullable()->unique()->after('id');
        });

        // Clerk owns the credential, so accounts created through the bridge
        // have no local password hash. Breeze accounts keep theirs.
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Any rows with a null password would block this, so clear them first
        // rather than failing the rollback.
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['clerk_id']);
            $table->dropColumn('clerk_id');
        });
    }
};
