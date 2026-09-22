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
        Schema::table('owners', function (Blueprint $table) {
            /*
             * Ties a client record to the account that signs in as an owner,
             * mirroring how veterinarians.user_id links staff. Nullable so
             * front-desk walk-ins can be recorded before they register.
             */
            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
        });

        Schema::table('owners', function (Blueprint $table) {
            // Registration only captures name and email, so the phone number
            // is filled in later from the owner's account page.
            $table->string('phone')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
        });

        Schema::table('owners', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
